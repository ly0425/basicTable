import IndexCache from './IndexCache';
import antlr4 from 'antlr4';
import { FormulaLexer } from '../../formulaCalc/FormulaLexer';
import { FormulaParser } from '../../formulaCalc/FormulaParser';
import EvalVisitor from '../../formulaCalc/EvalVisitor';
import ThrowingErrorListener, { MySyntaxError } from "../../formulaCalc/ThrowingErrorListener";
import { Observable, Subject, BehaviorSubject, ReplaySubject, from, of, range, combineLatest, merge, throwError } from 'rxjs';
import { map, catchError, multicast } from 'rxjs/operators';
import addressConverter from 'xlsx-populate/lib/addressConverter';

function convert(expression) {
  if (expression === undefined || expression === null) {
    return 0;
  }
  const num = Number(expression);
  const value = isNaN(num) ? expression : num;
  return value;
}

// 把 observable 中的错误包装为 Error 对象通过 next 发送，并在 whenToRetry 发出值时重试。
function wrapErrorAndRetryWhen(observable, whenToRetry) {
  return Observable.create(function subscribe(observer) {
    let gotError = false;
    const wrapErrorObserver = {
      next: x => observer.next(x),
      error: er => {
        console.warn('计算失败', er);
        observer.next(new Error(er.displayMsg || '计算失败'));
        gotError = true;
      },
      complete: () => observer.complete(),
    };
    let subscription;
    let whenToRetrySubscription;
    if (whenToRetry) {
      whenToRetrySubscription = whenToRetry.subscribe(x => {
        if (gotError) {
          gotError = false;
          if (subscription) subscription.unsubscribe();
          console.log('重试');
          subscription = observable.subscribe(wrapErrorObserver);
        }
      }, er => {
        observer.error(er);
      });
    }

    subscription = observable.subscribe(wrapErrorObserver);

    return function unsubscribe() {
      if (whenToRetrySubscription) {
        whenToRetrySubscription.unsubscribe();
      }
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  });
}

class Cell {
  _observable;
  _innerSubscription;
  storeSubscription;
  constructor(expression, cellCache, indexServ, context, address, formulaType, value) {
    // expression 可以是公式对象，可以是公式文本。
    if ((expression && expression.constructor === FormulaParser.ExprRootContext)
      || (typeof expression === 'string' && expression.trim().indexOf('=') === 0)) {
      try {
        let tree;
        if (typeof expression === 'string') {
          // console.log('expression:', expression);
          const chars = new antlr4.InputStream(expression);
          const lexer = new FormulaLexer(chars);
          lexer.addErrorListener(new ThrowingErrorListener());
          const tokenStream = new antlr4.CommonTokenStream(lexer);
          const parser = new FormulaParser(tokenStream);
          parser.addErrorListener(new ThrowingErrorListener());
          parser.buildParseTrees = true;
          tree = parser.exprRoot();
        } else {
          tree = expression;
        }

        const subject = new ReplaySubject(1);
        this._observable = subject;

        const VisitorClass = cellCache.visitorClass;
        const visitor = new VisitorClass(cellCache, indexServ, context, address);
        const observable = visitor.visit(tree);
        // formulaType: 要计算的公式类型，空：全计算；access: 取数公式；calc: 计算公式。
        // 不计算的直接取现有结果。
        const thisFormulaType = visitor.isAccess ? 'access' : 'calc';
        if (formulaType && thisFormulaType !== formulaType) {
          subject.next(convert(value));
          return;
        }
        const noErrorCellObservables = visitor.refCells.map(x => x.pipe(catchError(er => of(er))));
        const wrapErrorObservable = wrapErrorAndRetryWhen(observable,
          noErrorCellObservables.length > 0 ? merge(...noErrorCellObservables) : null);

        // 一般错误可恢复，通过 next 发送
        this._innerSubscription = wrapErrorObservable.subscribe((x) => {
          subject.next(x);
        }, err => subject.error(err));
      } catch (ex) {
        // 公式错误不可恢复
        console.warn('公式解析失败了，', expression, address, ex);
        this._observable = throwError(new Error('公式错误'));
      }
    } else {
      const value = convert(expression);
      this._observable = new BehaviorSubject(value);
    }
  }

  observable() {
    return this._observable;
  }

  unSub() {
    if (this._innerSubscription) {
      this._innerSubscription.unsubscribe();
    }
    if (this.storeSubscription) {
      this.storeSubscription.unsubscribe();
    }
  }
}

class CellCache {
  visitorClass = EvalVisitor; // 使用的 Visitor 类
  shouldCalcCell = undefined;
  calcType; // 计算的公式类型，access | calc，不指定时全部计算
  indexServ = new IndexCache();
  cache = new Map();
  floatCache = new Map();
  constructor() {
    this.indexServ.cellCache = this;
  }

  clearAll = () => {
    this.clearCells();
    this.clearIndexes();
  }

  clearCells = () => {
    this.cache.forEach(cell => cell.unSub());
    this.floatCache.forEach(map => {
      map.forEach(cell => cell.unSub());
    });

    this.cache.clear();
    this.floatCache.clear();
  }

  clearIndexes = () => {
    this.indexServ.clearCache();
  }

  getCell({ address, formula, value }, row = -1, col = -1, isForceCompute) {
    // FX 公式不计算，Fields 公式不计算
    if (typeof formula === 'string' && (formula.indexOf('FX.') > -1 || formula.indexOf('Fields.') > -1)) {
      formula = value;
    } else if (row > -1 && col > -1 && this.shouldCalcCell) {
      const { sheet } = this.context;
      const { tableRows, rowProps, colProps } = sheet;
      if (!this.shouldCalcCell(tableRows[row][col], rowProps[row], colProps[col], isForceCompute)) {
        formula = value;
      }
    }
    const address2 = address.toUpperCase();
    if (!this.cache.has(address2)) {
      const cell = new Cell(formula, this, this.indexServ, this.context, address, this.calcType, value);
      this.cache.set(address2, cell);
      return cell;
    } else {
      return this.cache.get(address2);
    }
  }

  getFloatCell({ areaId, floatId, col, formula, value }) {
    const key = `${areaId}-${floatId}`;
    if (!this.floatCache.has(key)) {
      this.floatCache.set(key, new Map());
    }
    const map = this.floatCache.get(key);
    if (!map.has(col)) {
      const cell = new Cell(formula, this, this.indexServ, this.context, { areaId, floatId }, this.calcType, value);
      map.set(col, cell);
      return cell;
    } else {
      return map.get(col);
    }
  }

  getCellValue = (args, row, col) => {
    return this.getCell(args, row, col).observable();
  }

  getFloatCellValue(args) {
    return this.getFloatCell(args).observable();
  }

  setContext = (ctx) => {
    this.context = ctx;
    this.indexServ.context = ctx;
  }

  nextCellValue = (index, col, value) => {
    console.log('nextCellValue', index, col, value);
    const address = addressConverter.columnNumberToName(col + 1) + (index + 1);
    this.getCellValue({ address, formula: value }).next(convert(value));
  }

  nextFloatCellValue = (floatId, col, value) => {
    console.log('nextFloatCellValue', floatId, col, value);
    this.getFloatCellValue({ floatId, col, formula: value }).next(convert(value));
  }

  insertRows = (sheet, shouldCalcCell, createObserver) => {
    for (let i = 0; i < sheet.rowProps.length; i++) {
      const prop = sheet.rowProps[i];
      if (prop.rowType === 'float' && !this.floatCache.has(prop.floatId)) {
        // 增的行
        const row = sheet.tableRows[i];
        for (let j = 0; j < row.length; j++) {
          const cell = row[j];
          if (shouldCalcCell(cell)) {
            const formula = cell.textBox.value;
            const templateRowIndex = { rowType: 'float', index: i - sheet.floatRowIndex };
            const floatId = prop.floatId;
            const observable = this.getFloatCellValue({ floatId, col: j, formula });
            observable.subscribe(createObserver({ templateRowIndex, floatId, col: j }));
          }
        }
      }
    }
  }

  removeRows = (sheet) => {
    const floatRowKeys = new Set();
    for (let i = 0; i < sheet.rowProps.length; i++) {
      const prop = sheet.rowProps[i];
      if (prop.rowType === 'float') {
        floatRowKeys.add(prop.floatId);
      }
    }
    for (const [key, map] of this.floatCache) {
      if (!floatRowKeys.has(key)) {
        map.forEach(cell => cell.unSub());
        this.floatCache.delete(key);
        console.log('清除 map', key, map);
      }
    };
  }
}
export default CellCache;

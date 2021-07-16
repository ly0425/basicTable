const formulaDictionary = {
    'VH_INDEX': '财务会计',
    '"RMB"': '"人民币"',
    '"NCJY"': '"年初借方余额"',
    '"NCJY0"': '"年初借方余额0"',
    '"NCDY"': '"年初贷方余额"',
    '"NCDY0"': '"年初贷方余额0"',
    '"YCJY"': '"期初借方余额"',
    '"YCJY0"': '"期初借方余额0"',
    '"YCDY"': '"期初贷方余额"',
    '"YCDY0"': '"期初贷方余额0"',
    '"YMJY"': '"期末借方余额"',
    '"YMJY0"': '"期末借方余额0"',
    '"YMDY"': '"期末贷方余额"',
    '"YMDY0"': '"期末贷方余额0"',
    '"YJF"': '"本期借方"',
    '"YDF"': '"本期贷方"',
    '"YJLF"': '"本年借方累计"',
    '"YDLF"': '"本年贷方累计"'
};

export const formulaTransform = (formula) => {
    for (let key in formulaDictionary) {
        const reg = new RegExp(key, 'g');
        formula = formula.replace(reg, formulaDictionary[key]);
    }
    return formula;
}
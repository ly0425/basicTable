const illegalSymbolCheck = (val) =>{
  return /[~#^$@%&*?\/\\<>]/gi.test(val);
}

export {illegalSymbolCheck}
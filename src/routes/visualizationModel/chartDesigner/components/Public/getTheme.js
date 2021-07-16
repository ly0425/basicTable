const getTheme = () => {
  let theme = window.$('body').prop('class').toLowerCase();
  //无论BI集成到什么平台，如果body的类名包含light或dark，统一都改成BI里的'light'/'dark'，否则取不到颜色。
  if (!theme || theme.indexOf('light')!=-1) {
    theme = 'light';
  }
  if (theme.indexOf('dark') != -1){ 
    theme = 'dark';
  }
  return theme;
}
export {getTheme};
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = (webpackConfig) => {
  // Avoid import all locale file of moment
  webpackConfig.output.filename="vadp-bi.js";
  webpackConfig.plugins.push(
    new ExtractTextPlugin('vadp-bi.css', {
      allChunks: true
    })
  )
  webpackConfig.module.rules[2].use[1].options.minimize=true;

  webpackConfig.plugins.push(new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/));
  webpackConfig.output = Object.assign({},webpackConfig.output,{
    library: 'vadpBI',
    libraryTarget: 'umd',
    umdNamedDefine: true,
  });
  
  // console.log(webpackConfig.plugins[7],"webpackConfig----")
  // console.log("-----------------------",webpackConfig.module.rules[1],)
  return webpackConfig;
};

const HtmlPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const rules = require('./webpack.config.rules')();
const path = require('path');

rules.push({
        test: /\.css$/i,
        use: [
            {
              loader: MiniCssExtractPlugin.loader,
            },
            'css-loader',
          ]
});

module.exports = {
    entry: {
        index: './src/index.js',
    },
    devServer: {
        index: 'index.html'
    },
    output: {
        filename: 'js/[name].[fullhash].js',
        path: path.resolve('dist')
    },
    // devtool: 'source-map',
    module: { rules },
    optimization: {
        minimizer: [
          // we specify a custom UglifyJsPlugin here to get source maps in production
          new UglifyJsPlugin({
            cache: true,
            parallel: true,
            uglifyOptions: {
              compress: false,
              ecma: 6,
              mangle: true
            },
            sourceMap: true
          })
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // all options are optional
            filename: 'css/[name].css',
            chunkFilename: '[id].css',
            ignoreOrder: false, // Enable to remove warnings about conflicting order
          }),
        new HtmlPlugin({
            title: 'GeoFeedback',
            template: 'index.hbs'
        }),
        new CleanWebpackPlugin(['dist'])
    ]
};

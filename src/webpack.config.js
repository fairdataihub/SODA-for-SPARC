const path = require('path');
const { merge } = require("webpack-merge")
const base = require("./webpack.base.config");

module.exports = {
    return merge( base, {
        mode: 'development',
        entry: {
            main: './main.js',
            renderer: './src/renderer.js'
        },
        output: {
            filename: "[name].js",
            path: path.resolve(__dirname, 'dist')
        },
    })
};
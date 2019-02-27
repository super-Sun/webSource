// var webpack = require('webpack');
module.exports = {
    entry: [
        __dirname + "/app/main.js",
    ], // 入口文件
    output: {
        path: __dirname + "/public", // 打包后存放的目录
        filename: "bundle.js" // 打包输出文件的文件名
    }
}

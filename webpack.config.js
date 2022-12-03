const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")

module.exports = {
    entry: {
        main: path.resolve(__dirname, "./src/index.ts")
    },
    output: {
        path: path.resolve(__dirname, "./docs"),
        filename: "[name].bundle.js",
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.ts$/,
                use: ["ts-loader"],
                exclude: /node_modules/
            }
        ],
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    plugins: [
        new HtmlWebpackPlugin({
            favicon: path.resolve(__dirname, "./src/favicon-diocletian.png"),
            filename: "index.html",
            template: path.resolve(__dirname, "./src/template.html"),
        }),
        new CleanWebpackPlugin()
    ]
}
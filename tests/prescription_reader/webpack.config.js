const HtmlWebpackPlugin = require("html-webpack-plugin")

module.exports = {
  entry: "./src/main.ts",
  mode: "development",
  //devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader"
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "Prescription Reader",
      template: "index.html",
      publicPath: "./"
    })
  ]
}
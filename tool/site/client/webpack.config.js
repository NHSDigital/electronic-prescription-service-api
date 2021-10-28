/* eslint-disable */
const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const CopyPlugin = require("copy-webpack-plugin")
const stylesHandler = "style-loader"
/* eslint-enable */

const config = {
  entry: ["./index.ts"],
  output: {
    path: path.resolve(__dirname),
    filename: "static/main.js"
  },
  optimization: {
    minimize: false
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "index.html",
      filename: "templates/client.html",
      publicPath: "{{public_apigee_url}}/{{base_url}}",
      inject: "head",
      scriptLoading: "blocking"

    }),
    new CopyPlugin({
      patterns: [
        {from: "./static", to: path.join(__dirname, "/static")}
      ]
    })
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/i,
        loader: "babel-loader"
      },
      {
        test: /\.(ts|tsx)$/i,
        loader: "ts-loader",
        exclude: ["/node_modules/"]
      },
      {
        test: /\.css$/i,
        use: [stylesHandler, "css-loader"]
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: "asset"
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  }
}

const isProduction = process.env.NODE_ENV === "production"

module.exports = () => {
  if (isProduction) {
    config.mode = "production"
  } else {
    config.mode = "development"
  }
  return config
}

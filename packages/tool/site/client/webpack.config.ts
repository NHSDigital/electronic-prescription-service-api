import path from "path"
import {Configuration, ProvidePlugin} from "webpack"
import ReplaceInFileWebpackPlugin from "replace-in-file-webpack-plugin"
import CopyPlugin from "copy-webpack-plugin"

const config: Configuration = {
  entry: {
    index: "./src/index.tsx",
    callCredentialManager: "./src/requests/callCredentialManager/callCredentialManager.ts"
  },
  devtool: "source-map",
  mode: "development",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js"
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              "@babel/preset-react",
              "@babel/preset-typescript"
            ]
          }
        }
      }
    ]
  },
  plugins: [
    new ProvidePlugin({
      Buffer: ["buffer", "Buffer"]
    }),
    new ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery"
    }),
    new CopyPlugin({
      patterns: [
        {from: "./static", to: path.join(__dirname, "dist/client")}
      ]
    }),
    new ReplaceInFileWebpackPlugin([{
      dir: "dist/client",
      files: ["callCredentialManager.js"],
      rules: [{
        search: '"PLACEHOLDER_REPLACED_BY_WEBPACK"',
        replace: '"http://localhost:"+prService.portNumber()+"/signalr"'
      }]
    }])
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      "fs": false,
      "tls": false,
      "net": false,
      "path": false,
      "zlib": false,
      "http": false,
      "https": false,
      "stream": false,
      "crypto": false
    }
  }
}

export default config

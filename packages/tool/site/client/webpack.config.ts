import path from "path"
import {Configuration, ProvidePlugin} from "webpack"

const config: Configuration = {
  entry: "./src/index.tsx",
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
  devtool: "eval-source-map",
  plugins: [
    new ProvidePlugin({
      Buffer: ["buffer", "Buffer"]
    })
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
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js"
  }
}

export default config

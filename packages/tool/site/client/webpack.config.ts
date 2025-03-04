import path from "path"
import webpack from "webpack"
import {fileURLToPath} from "url"
import type {Configuration} from "webpack"

// Compute __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"]
      }
    ]
  },
  devtool: "source-map",
  plugins: [
    new webpack.ProvidePlugin({
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

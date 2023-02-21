module.exports = {
  roots: ["./tests"],
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    // Because axios is now published with both ESM and CommonJS exports, and
    // because Jest runs code in Node, we have to force it to import the
    // module using the CommonJS import, to avoid the following error:
    // "Jest encountered an unexpected token [...] import axios from './lib/axios.js';"
    // Source: https://github.com/axios/axios/issues/5101#issuecomment-1276572468
    "^axios$": require.resolve("axios"),
  }
}

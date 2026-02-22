// eslint-disable-next-line no-undef
module.exports = {
  roots: ["./tests"],
  transform: {
    "^.+\\.[tj]sx?$": "ts-jest"
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(react-diff-viewer-continued)/)"
  ],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "\\.(css|less)$": "identity-obj-proxy"
  }
}

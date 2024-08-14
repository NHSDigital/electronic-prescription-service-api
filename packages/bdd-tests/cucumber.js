// eslint-disable-next-line no-undef
module.exports = {
  default: [
    "--require-module ts-node/register",
    "--require step_definitions/*.ts"
  ].join(" ")
}

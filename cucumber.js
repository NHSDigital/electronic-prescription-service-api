module.exports = {
  default: [
    "--require-module ts-node/register",
    "--require packages/bdd-tests/step_definitions/*.ts",
    "--publish-quiet"
  ].join(" ")
}

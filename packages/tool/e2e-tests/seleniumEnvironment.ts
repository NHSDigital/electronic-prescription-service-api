import {Event} from "jest-circus"
import NodeEnvironment from "jest-environment-node"
import {EnvironmentContext, JestEnvironmentConfig} from "@jest/environment"

export default class CustomEnvironment extends NodeEnvironment {
  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context)
    this.global.hasTestFailures = false
  }

  async handleTestEvent(event: Event) :Promise<void> {
    if (event.name === "test_fn_failure") {
      this.global.hasTestFailures = true
      console.log("***** ERROR IN TEST *****")
      console.log(event)
      console.log()
    }
  }

}

module.exports = CustomEnvironment

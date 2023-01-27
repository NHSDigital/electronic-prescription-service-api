import {Event} from "jest-circus"
import NodeEnvironment from "jest-environment-node"
import {EnvironmentContext, JestEnvironmentConfig} from "@jest/environment"

export default class CustomEnvironment extends NodeEnvironment {
  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context)
    this.global.hasTestFailures = false
  }

  handleTestEvent(event: Event) :void {
    if (event.name === "test_fn_failure") {
      this.global.hasTestFailures = true
    }
  }

}

module.exports = CustomEnvironment

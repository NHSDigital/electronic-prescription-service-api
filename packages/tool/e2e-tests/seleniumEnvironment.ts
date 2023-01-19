import {Event, State} from 'jest-circus';
import type {Config} from '@jest/types';
import NodeEnvironment from 'jest-environment-node';
import { EnvironmentContext, JestEnvironmentConfig } from '@jest/environment';

export default class CustomEnvironment extends NodeEnvironment {
  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context);
    this.global.hasTestFailures = false
  }

  handleTestEvent(event: Event, state: State) {
    if (event.name === 'test_fn_failure') {
      this.global.hasTestFailures = true
    }
  }

}

module.exports = CustomEnvironment

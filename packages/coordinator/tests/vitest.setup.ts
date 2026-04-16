import {toContainObject} from "./matchers/toContainObject"
import {expect} from "vitest"

expect.extend(
  {toContainObject: toContainObject as never}
)

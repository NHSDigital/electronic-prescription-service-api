// Typescript allows compilation using path aliases but does not support runtime
// See: https://github.com/microsoft/TypeScript/issues/10866
// this package allows adding aliases at runtime to accomplish the same thing
// that paths in tsconfig.json allows at compile time
// aliases are added to package.json and the below ensures it is always relative
// to this entrypoint
import {default as moduleAlias} from "module-alias"
moduleAlias(__dirname + "/../../package.json")
// *****************************************************************************

import {init} from "./server"

process.on("unhandledRejection", (err) => {
  console.log(err)
  process.exit(1)
})

init()

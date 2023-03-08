import {SHA1} from "crypto-js"
import React, {Fragment} from "react"

export function newLineFormatter(lines: Array<string>): Array<JSX.Element> {
  return lines.map((line, index) => (
    <Fragment key={SHA1(`${line}`)}>
      {index > 0 && <br/>}
      {line}
    </Fragment>
  ))
}

import {Fragment} from "react"
import * as React from "react"

export function newLineFormatter(lines: Array<string>): Array<JSX.Element> {
  return lines.map((line, index) => (
    <Fragment key={index}>
      {index > 0 && <br/>}
      {line}
    </Fragment>
  ))
}

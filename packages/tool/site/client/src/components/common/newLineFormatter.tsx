import React, {Fragment} from "react"
import hash from "object-hash"

export function newLineFormatter(lines: Array<string>): Array<JSX.Element> {
  return lines.map((line, index) => (
    <Fragment key={hash.sha1(`${index}${line}`)}>
      {index > 0 && <br/>}
      {line}
    </Fragment>
  ))
}

import React from "react"
import {CrossIcon, TickIcon} from "nhsuk-react-components"

const SuccessOrFail: React.FC<{condition: boolean}> = ({
  condition
}) => {
  return condition ? <TickIcon /> : <CrossIcon />
}

export default SuccessOrFail

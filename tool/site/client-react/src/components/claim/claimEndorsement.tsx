import * as React from "react"
import {Input, Select} from "nhsuk-react-components"
import dispenserEndorsementCodings from "./reference-data/dispenserEndorsementCodings"
import {DeepPartial} from "../stateHelpers"

export interface EndorsementInfo {
  code: string
  supportingInfo: string
}

interface ClaimEndorsementProps {
  index: number
  value: EndorsementInfo
  callback: (endorsement: DeepPartial<EndorsementInfo>) => void
}

const ClaimEndorsement: React.FC<ClaimEndorsementProps> = ({
  index,
  value,
  callback
}) => {
  return (
    <>
      <Select
        id={"endorsement-code-" + index}
        label={"Endorsement " + (index + 1)}
        value={value.code}
        onChange={event => callback({code: event.target.value})}
      >
        {dispenserEndorsementCodings.map(coding =>
          <Select.Option key={coding.code} value={coding.code}>{coding.display}</Select.Option>
        )}
      </Select>
      <Input
        id={"endorsement-supporting-info-" + index}
        label={"Endorsement " + (index + 1) + " Supporting Information"}
        width={30}
        value={value.supportingInfo}
        onChange={event => callback({supportingInfo: event.target.value})}/>
    </>
  )
}

export default ClaimEndorsement

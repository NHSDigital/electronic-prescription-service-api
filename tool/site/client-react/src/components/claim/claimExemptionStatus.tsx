import * as React from "react"
import {Checkboxes, Fieldset, Select} from "nhsuk-react-components"
import chargeExemptionCodings from "./reference-data/chargeExemptionCodings"
import {DeepPartial} from "../stateHelpers"

export interface ExemptionInfo {
  exemptionStatus: string,
  evidenceSeen: boolean
}

interface ClaimExemptionStatusProps {
  value: ExemptionInfo
  callback: (exemptionInfo: DeepPartial<ExemptionInfo>) => void
}

const ClaimExemptionStatus: React.FC<ClaimExemptionStatusProps> = ({
  value,
  callback
}) => {
  return (
    <Fieldset>
      <Fieldset.Legend size="m">Charge Exemption</Fieldset.Legend>
      <Select
        id="exemption-status"
        label="Exemption Status"
        value={value.exemptionStatus}
        onChange={event => callback({exemptionStatus: event.target.value})}
      >
        {chargeExemptionCodings.map(coding =>
          <Select.Option key={coding.code} value={coding.code}>{coding.display}</Select.Option>
        )}
      </Select>
      <Checkboxes>
        <Checkboxes.Box
          id="evidence-seen"
          checked={value.evidenceSeen}
          onChange={event => callback({evidenceSeen: event.target.checked})}
        >
          Evidence Seen
        </Checkboxes.Box>
      </Checkboxes>
    </Fieldset>
  )
}

export default ClaimExemptionStatus

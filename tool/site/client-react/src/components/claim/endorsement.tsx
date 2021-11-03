import {Field} from "formik"
import {Button, Input, Select} from "nhsuk-react-components"
import {VALUE_SET_DISPENSER_ENDORSEMENT} from "./reference-data/valueSets"
import * as React from "react"
import ButtonList from "../buttonList"

interface EndorsementProps {
  name: string
  label: string
  removeEndorsement: () => void
}

const Endorsement: React.FC<EndorsementProps> = ({
  name,
  label,
  removeEndorsement
}) => (
  <>
    <Field id={`${name}.code`} name={`${name}.code`} as={Select} label={`${label} Type`}>
      {VALUE_SET_DISPENSER_ENDORSEMENT.map(coding =>
        <Select.Option key={coding.code} value={coding.code}>{coding.display}</Select.Option>
      )}
    </Field>
    <Field
      id={`${name}.supportingInfo`}
      name={`${name}.supportingInfo`}
      as={Input}
      width={30}
      label={`${label} Supporting Information`}
    />
    <ButtonList>
      <Button type="button" onClick={removeEndorsement} secondary>Remove Endorsement</Button>
    </ButtonList>
  </>
)

export default Endorsement

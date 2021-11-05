import {Field} from "formik"
import {Button, Input, Select} from "nhsuk-react-components"
import * as React from "react"
import ButtonList from "../buttonList"
import {VALUE_SET_DISPENSER_ENDORSEMENT} from "../../fhir/reference-data/valueSets"
import SelectField, {convertCodingsToOptions} from "../SelectField"

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
    <SelectField
      name={`${name}.code`}
      label={`${label} Type`}
      fieldOptions={convertCodingsToOptions(VALUE_SET_DISPENSER_ENDORSEMENT)}
    />
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

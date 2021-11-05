import {Checkboxes, Fieldset, Select} from "nhsuk-react-components"
import {Field} from "formik"
import * as React from "react"
import {
  VALUE_SET_DISPENSER_ENDORSEMENT,
  VALUE_SET_PRESCRIPTION_CHARGE_EXEMPTION
} from "../../fhir/reference-data/valueSets"
import SelectField, {convertCodingsToOptions} from "../SelectField"

interface ExemptionProps {
  name: string
}

const Exemption: React.FC<ExemptionProps> = ({
  name
}) => (
  <Fieldset>
    <Fieldset.Legend size="m">Prescription Charge Exemption</Fieldset.Legend>
    <SelectField
      name={`${name}.code`}
      label={`Exemption Status`}
      fieldOptions={convertCodingsToOptions(VALUE_SET_PRESCRIPTION_CHARGE_EXEMPTION)}
    />
    <Checkboxes id={`${name}.evidenceSeen.boxes`}>
      <Field id={`${name}.evidenceSeen.box`} name={`${name}.evidenceSeen`} type="checkbox" as={Checkboxes.Box}>
        Evidence Seen
      </Field>
    </Checkboxes>
  </Fieldset>
)

export default Exemption

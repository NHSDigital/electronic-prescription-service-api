import {Checkboxes, Fieldset, Select} from "nhsuk-react-components"
import {Field} from "formik"
import {VALUE_SET_PRESCRIPTION_CHARGE_EXEMPTION} from "./reference-data/valueSets"
import * as React from "react"

interface ExemptionProps {
  name: string
}

const Exemption: React.FC<ExemptionProps> = ({
  name
}) => (
  <Fieldset>
    <Fieldset.Legend size="m">Prescription Charge Exemption</Fieldset.Legend>
    <Field name={`${name}.code`} as={Select} label="Exemption Status">
      {VALUE_SET_PRESCRIPTION_CHARGE_EXEMPTION.map(coding =>
        <Select.Option key={coding.code} value={coding.code}>{coding.display}</Select.Option>
      )}
    </Field>
    <Checkboxes>
      <Field name={`${name}.evidenceSeen`} type="checkbox" as={Checkboxes.Box}>Evidence Seen</Field>
    </Checkboxes>
  </Fieldset>
)

export default Exemption

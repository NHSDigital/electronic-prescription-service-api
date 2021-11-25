import React, {FC} from "react"
import {Radios} from "nhsuk-react-components"
import {Field} from "formik"

export interface RadioFieldProps {
  name: string
  label: string
  fieldRadios: Array<Radio>
}

interface Radio {
  value: string
  text: string
}

const RadioField: FC<RadioFieldProps> = ({name, label, fieldRadios}) => (
  <Field id={name} name={name} labelProps={{bold: true}} label={label} as={Radios}>
      {fieldRadios.map((radio, index) =>
        <Radios.Radio key={index} value={radio.value}>{radio.text}</Radios.Radio>
      )}
  </Field>
)

export default RadioField

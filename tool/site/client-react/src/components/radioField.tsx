import React, {FC} from "react"
import {Radios} from "nhsuk-react-components"
import {Field} from "formik"

export interface RadioFieldProps {
  name: string
  label: string
  fieldRadios: Array<Radio>
  defaultValue?: string
  error?: string
}

interface Radio {
  value: string
  text: string
}

const RadioField: FC<RadioFieldProps> = ({name, label, fieldRadios, defaultValue, error}) => (
  <Field id={name} name={name} labelProps={{bold: true}} label={label} error={error} as={Radios}>
    {fieldRadios.map((radio, index) =>
      <Radios.Radio key={index} value={radio.value} defaultChecked={defaultValue === radio.value}>{radio.text}</Radios.Radio>
    )}
  </Field>
)

export default RadioField

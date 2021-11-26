import React, {FC} from "react"
import {Radios} from "nhsuk-react-components"
import {Field} from "formik"

export interface RadioFieldProps {
  name: string
  label: string
  fieldRadios: Array<Radio>
  error?: string
}

interface Radio {
  value: string
  text: string
  defaultChecked?: boolean
}

const RadioField: FC<RadioFieldProps> = ({name, label, fieldRadios, error}) => (
  <Field id={name} name={name} labelProps={{bold: true}} label={label} error={error} as={Radios}>
    {fieldRadios.map((radio, index) =>
      <Radios.Radio key={index} value={radio.value} defaultChecked={radio.defaultChecked}>{radio.text}</Radios.Radio>
    )}
  </Field>
)

export default RadioField

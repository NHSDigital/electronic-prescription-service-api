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
  <Field id={name} name={name} as={Radios}>
    <Radios
      name={name}
      id={name}
      labelProps={{bold: true}}
      label={label}
    >
      {fieldRadios.map((radio, index) =>
        <Radios.Radio key={index} value={radio.value}>{radio.text}</Radios.Radio>
      )}
    </Radios>
  </Field>
)

export default RadioField

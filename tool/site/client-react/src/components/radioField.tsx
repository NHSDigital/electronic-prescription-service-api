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

const errorStyle: React.CSSProperties = {color: "red", marginBottom: "20px"}

const RadioField: FC<RadioFieldProps> = ({name, label, fieldRadios, error}) => (
  <Field id={name} name={name} labelProps={{bold: true}} label={label} as={Radios}>
    {error &&
        <p style={errorStyle}>{error}</p>
    }
    {fieldRadios.map((radio, index) =>
      <Radios.Radio key={index} value={radio.value} defaultChecked={radio.defaultChecked}>{radio.text}</Radios.Radio>
    )}
  </Field>
)

export default RadioField

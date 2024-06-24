import React, {FC, FormEventHandler} from "react"
import {Radios} from "nhsuk-react-components"
import {Field} from "formik"

export interface RadioFieldProps {
  name: string
  label: string
  fieldRadios: Array<Radio>
  defaultValue?: string
  onClick?: FormEventHandler<HTMLElement>
  error?: string
}

interface Radio {
  id: number
  value: string
  text: string
}

const RadioField: FC<RadioFieldProps> = ({name, label, fieldRadios, defaultValue, onClick, error}) => (
  <Field id={name} name={name} labelProps={{bold: true}} aria-label={label} label={label} onClick={onClick} error={error} as={Radios}>
    {fieldRadios.map(radio =>
      <Radios.Radio
        key={radio.id}
        value={radio.value}
        defaultChecked={defaultValue === radio.value}
      >
        {radio.text}
      </Radios.Radio>
    )}
  </Field>
)

export default RadioField

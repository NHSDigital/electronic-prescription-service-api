import React, {FC} from "react"
import {Select} from "nhsuk-react-components"
import {Field} from "formik"
import {Coding} from "fhir/r4"

export interface SelectFieldProps {
  name: string
  label: string
  fieldOptions: Array<Option>
}

interface Option {
  value: string
  text: string
}

const SelectField: FC<SelectFieldProps> = ({name, label, fieldOptions}) => (
  <Field id={name} name={name} as={Select} label={label}>
    {fieldOptions.map((option, index) =>
      <Select.Option key={index} value={option.value}>{option.text}</Select.Option>
    )}
  </Field>
)

export const convertCodingsToOptions = (codings: Array<Coding>): Array<Option> => codings.map((coding: Coding): Option => ({
  value: coding.code,
  text: coding.display
}))

export default SelectField

import React, {FC, HTMLProps} from "react"
import {Select} from "nhsuk-react-components"
import {Field} from "formik"
import {Coding} from "fhir/r4"
import {FormElementProps} from "nhsuk-react-components/dist/esm/util/types/FormTypes"

export interface SelectFieldProps extends HTMLProps<HTMLSelectElement>, FormElementProps {
  fieldOptions: Array<Option>
}

interface Option {
  id: number,
  value: string
  text: string
}

const SelectField: FC<SelectFieldProps> = ({fieldOptions, ...otherProps}) => (
  <Field as={Select} {...otherProps}>
    {fieldOptions.map(option =>
      <Select.Option key={option.id} value={option.value}>{option.text}</Select.Option>
    )}
  </Field>
)

export const convertCodingsToOptions = (codings: Array<Coding>, includeEmpty?: boolean): Array<Option> => {
  const options = codings.map((coding: Coding, index): Option => ({
    id: index + (includeEmpty ? 1 : 0),
    value: coding.code,
    text: coding.display
  }))
  if (includeEmpty) {
    options.unshift({
      id: 0,
      value: "",
      text: ""
    })
  }
  return options
}

export default SelectField

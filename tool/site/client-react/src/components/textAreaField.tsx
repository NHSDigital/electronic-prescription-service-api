import React, {CSSProperties, FC} from "react"
import {Textarea} from "nhsuk-react-components"
import {Field} from "formik"

export interface TextAreaFieldProps {
  name: string
  defaultValue?: string
  style?: CSSProperties
}

const TextAreaField: FC<TextAreaFieldProps> = ({name, defaultValue, style}) => (
  <Field id={name} name={name} defaultValue={defaultValue} style={style} as={Textarea} component="textarea"></Field>
)

export default TextAreaField

import * as React from "react"
import {useEffect} from "react"
import {Field, FieldAttributes, useField} from "formik"

interface ConditionalFieldProps extends FieldAttributes<any> {
  name: string,
  condition: boolean
}

const ConditionalField: React.FC<ConditionalFieldProps> = ({
  name,
  condition,
  ...extraProps
}) => {
  const [, meta, helpers] = useField(name)
  useEffect(() => {
    if (!condition) {
      helpers.setValue(meta.initialValue)
      helpers.setTouched(meta.initialTouched)
      helpers.setError(meta.initialError)
    }
  }, [condition])

  return condition
    ? <Field name={name} {...extraProps}/>
    : null
}

export default ConditionalField

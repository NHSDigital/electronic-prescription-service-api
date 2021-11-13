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
    // Including meta and helpers in deps results in an infinite update loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [condition])

  return condition && <Field name={name} {...extraProps}/>
}

export default ConditionalField

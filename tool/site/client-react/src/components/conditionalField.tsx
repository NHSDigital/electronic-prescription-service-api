import React, {useEffect} from "react"
import {useField} from "formik"
import SelectField, {SelectFieldProps} from "./SelectField"

interface ConditionalFieldProps extends SelectFieldProps {
  condition: boolean
}

const ConditionalField: React.FC<ConditionalFieldProps> = ({
  condition,
  ...extraProps
}) => {
  const [, meta, helpers] = useField(extraProps.fieldName)
  useEffect(() => {
    if (!condition) {
      helpers.setValue(meta.initialValue)
      helpers.setTouched(meta.initialTouched)
      helpers.setError(meta.initialError)
    }
  }, [condition])

  return condition && <SelectField {...extraProps}/>
}

export default ConditionalField

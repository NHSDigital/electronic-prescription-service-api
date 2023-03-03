import * as React from "react"
import {Field, FieldAttributes, getIn, useFormikContext} from "formik"
import {DispenseFormValues} from "../dispense/dispenseForm"

interface ConditionalFieldProps extends FieldAttributes<any> {
  name: string,
  condition: boolean
}

const ConditionalField: React.FC<ConditionalFieldProps> = ({
  name,
  condition,
  ...extraProps
}) => {
  const {
    initialErrors,
    initialTouched,
    initialValues,
    setFieldError,
    setFieldTouched,
    setFieldValue
  } = useFormikContext<DispenseFormValues>()
  React.useEffect(() => {
    if (!condition) {
      const initialFieldError = getIn(initialErrors, name)
      setFieldError(name, initialFieldError)
      const initialFieldTouched = getIn(initialTouched, name)
      setFieldTouched(name, initialFieldTouched)
      const initialFieldValue = getIn(initialValues, name)
      setFieldValue(name, initialFieldValue)
    }
  }, [condition, name, initialErrors, initialTouched, initialValues, setFieldError, setFieldTouched, setFieldValue])

  return condition && <Field name={name} {...extraProps}/>
}

export default ConditionalField

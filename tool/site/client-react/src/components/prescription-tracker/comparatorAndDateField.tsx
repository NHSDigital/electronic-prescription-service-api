import {DateInput, Fieldset} from "nhsuk-react-components"
import SelectField from "../selectField"
import {Field, FormikErrors, getIn, useFormikContext} from "formik"
import * as React from "react"
import {createMoment} from "../../pages/prescriptionSearchPage"

const DATE_FIELD_NAMES: Array<keyof DateValues> = ["day", "month", "year"]
const COMPARATOR_AND_DATE_FIELD_NAMES: Array<keyof ComparatorAndDateValues> = ["comparator", "day", "month", "year"]
const DATE_COMPARATOR_OPTIONS = [
  {
    value: "",
    text: ""
  },
  {
    value: "le",
    text: "On or before"
  },
  {
    value: "eq",
    text: "On"
  },
  {
    value: "ge",
    text: "On or after"
  }
]

export interface DateValues {
  day?: string
  month?: string
  year?: string
}

export interface ComparatorAndDateValues extends DateValues {
  comparator?: string
}

interface ComparatorAndDateFieldProps {
  id: string
  name: string
  label: string
}

const ComparatorAndDateField: React.FC<ComparatorAndDateFieldProps> = ({
  id,
  name,
  label
}) => {
  const {errors} = useFormikContext()
  const fieldErrors = getIn(errors, name)
  const comparatorError = fieldErrors?.comparator
  const dayError = fieldErrors?.day
  const monthError = fieldErrors?.month
  const yearError = fieldErrors?.year
  return (
    <Fieldset>
      <Fieldset.Legend>{label}</Fieldset.Legend>
      <SelectField
        id={`${id}.comparator`}
        name={`${name}.comparator`}
        label="Search Type"
        error={comparatorError}
        fieldOptions={DATE_COMPARATOR_OPTIONS}
      />
      <DateInput id={`${id}.date`} name={`${name}.date`} error={dayError || monthError || yearError}>
        <Field id={`${id}.day`} name={`${name}.day`} error={dayError || false} as={DateInput.Day}/>
        <Field id={`${id}.month`} name={`${name}.month`} error={monthError || false} as={DateInput.Month}/>
        <Field id={`${id}.year`} name={`${name}.year`} error={yearError || false} as={DateInput.Year}/>
      </DateInput>
    </Fieldset>
  )
}

export function validateComparatorAndDateField(values: ComparatorAndDateValues): FormikErrors<ComparatorAndDateValues> {
  const authoredOnErrors: Array<[keyof ComparatorAndDateValues, string]> = []

  if (COMPARATOR_AND_DATE_FIELD_NAMES.some(key => values[key])) {
    COMPARATOR_AND_DATE_FIELD_NAMES
      .filter(key => !values[key])
      .forEach(key => authoredOnErrors.push([key, "All fields are required for a date search"]))
  }

  if (DATE_FIELD_NAMES.every(key => values[key])) {
    const moment = createMoment(values)
    if (!moment.isValid()) {
      DATE_FIELD_NAMES.forEach(key => authoredOnErrors.push([key, "Invalid date"]))
    }
  }

  if (authoredOnErrors.length) {
    return Object.fromEntries(authoredOnErrors)
  }
}

export default ComparatorAndDateField

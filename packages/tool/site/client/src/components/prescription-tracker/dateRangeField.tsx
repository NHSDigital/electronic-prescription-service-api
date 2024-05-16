import {DateInput, Fieldset} from "nhsuk-react-components"
import SelectField, {convertCodingsToOptions} from "../common/selectField"
import {Field, FormikErrors, getIn, useFormikContext} from "formik"
import * as React from "react"
import moment from "moment"
import ConditionalField from "../common/conditionalField"
import {FormElementProps} from "nhsuk-react-components/dist/esm/util/types/FormTypes"
import {Coding} from "fhir/r4"

export enum DateRangeType {
  ON = "On",
  FROM = "From",
  UNTIL = "Until",
  BETWEEN = "Between"
}

const DATE_RANGE_TYPE_CODINGS: Array<Coding> = Object.values(DateRangeType).map(code => ({code, display: code}))

interface DateValues {
  day?: string
  month?: string
  year?: string
}

export interface DateRangeValues {
  type?: "" | DateRangeType
  exact?: DateValues
  low?: DateValues
  high?: DateValues
}

const DATE_INITIAL_VALUES: DateValues = {
  day: "",
  month: "",
  year: ""
}

export const DATE_RANGE_INITIAL_VALUES: DateRangeValues = {
  type: "",
  exact: DATE_INITIAL_VALUES,
  low: DATE_INITIAL_VALUES,
  high: DATE_INITIAL_VALUES
}

interface DateRangeFieldProps {
  id: string
  name: string
  label: string
}

const DateRangeField: React.FC<DateRangeFieldProps> = ({
  id,
  name,
  label
}) => {
  const {values} = useFormikContext()
  const value: DateRangeValues = getIn(values, name)
  const dateRangeType = value?.type
  return (
    <Fieldset>
      <SelectField
        id={`${id}.type`}
        name={`${name}.type`}
        label={label}
        hint="Ranges are inclusive of their start and end dates"
        fieldOptions={convertCodingsToOptions(DATE_RANGE_TYPE_CODINGS, true)}
      />
      <ConditionalField
        id={`${name}.exact`}
        name={`${name}.exact`}
        label="Exact Date"
        condition={requiresExactDate(dateRangeType)}
        as={DateField}
      />
      <ConditionalField
        id={`${name}.low`}
        name={`${name}.low`}
        label="Earliest Date"
        condition={requiresLowDate(dateRangeType)}
        as={DateField}
      />
      <ConditionalField
        id={`${name}.high`}
        name={`${name}.high`}
        label="Latest Date"
        condition={requiresHighDate(dateRangeType)}
        as={DateField}
      />
    </Fieldset>
  )
}

function requiresExactDate(dateRangeType) {
  return dateRangeType === DateRangeType.ON
}

function requiresLowDate(dateRangeType) {
  return dateRangeType === DateRangeType.FROM
    || dateRangeType === DateRangeType.BETWEEN
}

function requiresHighDate(dateRangeType) {
  return dateRangeType === DateRangeType.UNTIL
    || dateRangeType === DateRangeType.BETWEEN
}

interface DateFieldProps extends FormElementProps {
  id: string
  name: string
}

const DateField: React.FC<DateFieldProps> = ({
  id,
  name,
  ...extraProps
}) => {
  const {errors} = useFormikContext()
  const fieldErrors: FormikErrors<DateValues> = getIn(errors, name)
  const dayError = fieldErrors?.day
  const monthError = fieldErrors?.month
  const yearError = fieldErrors?.year
  return (
    <DateInput id={id} name={name} error={dayError || monthError || yearError} autoSelectNext {...extraProps}>
      <Field id={`${id}.day`} name={`${name}.day`} error={dayError || false} as={DateInput.Day}/>
      <Field id={`${id}.month`} name={`${name}.month`} error={monthError || false} as={DateInput.Month}/>
      <Field id={`${id}.year`} name={`${name}.year`} error={yearError || false} as={DateInput.Year}/>
    </DateInput>
  )
}

export function validateDateRangeField(values: DateRangeValues): FormikErrors<DateRangeValues> {
  const errors: Array<[keyof DateRangeValues, string | FormikErrors<DateValues>]> = []

  if (requiresExactDate(values.type)) {
    const exactDateErrors = validateDateField(values.exact)
    if (exactDateErrors) {
      errors.push(["exact", exactDateErrors])
    }
  }

  if (requiresLowDate(values.type)) {
    const lowDateErrors = validateDateField(values.low)
    if (lowDateErrors) {
      errors.push(["low", lowDateErrors])
    }
  }

  if (requiresHighDate(values.type)) {
    const highDateErrors = validateDateField(values.high)
    if (highDateErrors) {
      errors.push(["high", highDateErrors])
    }
  }

  if (errors.length) {
    return Object.fromEntries(errors)
  }
}

function validateDateField(values: DateValues): FormikErrors<DateValues> {
  const errors: Array<[keyof DateValues, string]> = []

  const dateFieldNames: Array<keyof DateValues> = ["day", "month", "year"]

  dateFieldNames
    .filter(key => !values[key])
    .forEach(key => errors.push([key, "All fields are required for a date search"]))

  if (dateFieldNames.every(key => values[key])) {
    const valuesAsMoment = createMoment(values)
    if (!valuesAsMoment.isValid()) {
      dateFieldNames.forEach(key => errors.push([key, "Invalid date"]))
    }
  }

  if (errors.length) {
    return Object.fromEntries(errors)
  }
}

export function createDateRangeQueryParameters(dateRangeValues: DateRangeValues): Array<string> {
  const params: Array<string> = []

  if (requiresExactDate(dateRangeValues.type)) {
    const formattedExactDate = createMoment(dateRangeValues.exact).format("YYYY-MM-DD")
    params.push(`eq${formattedExactDate}`)
  }

  if (requiresLowDate(dateRangeValues.type)) {
    const formattedLowDate = createMoment(dateRangeValues.low).format("YYYY-MM-DD")
    params.push(`ge${formattedLowDate}`)
  }

  if (requiresHighDate(dateRangeValues.type)) {
    const formattedHighDate = createMoment(dateRangeValues.high).format("YYYY-MM-DD")
    params.push(`le${formattedHighDate}`)
  }

  return params
}

function createMoment(dateValues: DateValues): moment.Moment {
  return moment.utc({
    day: parseInt(dateValues.day),
    month: parseInt(dateValues.month) - 1,
    year: parseInt(dateValues.year)
  }, true)
}

export default DateRangeField

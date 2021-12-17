import * as React from "react"
import {Field, Formik, FormikErrors} from "formik"
import {Button, DateInput, Fieldset, Form, Label} from "nhsuk-react-components"
import {MaskedInput} from "nhsuk-react-components-extensions"
import ButtonList from "../buttonList"
import {
  ComparatorAndDateValues,
  createMoment,
  DateValues,
  PrescriptionSearchCriteria
} from "../../pages/prescriptionSearchPage"
import {BackButton} from "../backButton"
import SelectField, {convertCodingsToOptions} from "../selectField"
import {VALUE_SET_PRESCRIPTION_STATUS} from "../../fhir/reference-data/valueSets"

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

interface PrescriptionSearchFormProps {
  prescriptionId: string,
  onSubmit: (values: PrescriptionSearchCriteria) => void
}

const PrescriptionSearchForm: React.FC<PrescriptionSearchFormProps> = ({
  prescriptionId,
  onSubmit
}) => {
  const initialValues: PrescriptionSearchCriteria = {
    prescriptionId: prescriptionId ?? "",
    patientId: "",
    businessStatus: "",
    authoredOn: {
      comparator: "",
      day: "",
      month: "",
      year: ""
    }
  }

  const validate = (values: PrescriptionSearchCriteria) => {
    const errors: FormikErrors<PrescriptionSearchCriteria> = {}

    if (!values.prescriptionId && !values.patientId) {
      errors.prescriptionId = "One of Prescription ID or NHS Number is required"
      errors.patientId = "One of Prescription ID or NHS Number is required"
    }

    const authoredOnErrors: Array<[keyof ComparatorAndDateValues, string]> = []

    if (COMPARATOR_AND_DATE_FIELD_NAMES.some(key => values.authoredOn[key])) {
      COMPARATOR_AND_DATE_FIELD_NAMES
        .filter(key => !(values.authoredOn)[key])
        .forEach(key => authoredOnErrors.push([key, "All fields are required for a date search"]))
    }

    if (DATE_FIELD_NAMES.every(key => values.authoredOn[key])) {
      const moment = createMoment(values.authoredOn)
      if (!moment.isValid()) {
        DATE_FIELD_NAMES.forEach(key => authoredOnErrors.push([key, "Invalid date"]))
      }
    }

    if (authoredOnErrors.length) {
      errors.authoredOn = Object.fromEntries(authoredOnErrors)
    }

    return errors
  }

  return (
    <Formik<PrescriptionSearchCriteria>
      initialValues={initialValues}
      onSubmit={onSubmit}
      validate={validate}
      validateOnBlur={false}
      validateOnChange={false}
    >
      {({handleSubmit, handleReset, errors}) => (
        <Form onSubmit={handleSubmit} onReset={handleReset}>
          <Label isPageHeading>Search for a Prescription</Label>
          <Field
            id="prescriptionId"
            name="prescriptionId"
            label="Prescription ID"
            hint="Use the short form here, e.g. E3E6FA-A83008-41F09Y"
            error={errors.prescriptionId}
            width={20}
            mask="******-******-******"
            maskChar=""
            autoComplete="off"
            as={MaskedInput}
          />
          <Field
            id="patientId"
            name="patientId"
            label="NHS Number"
            error={errors.patientId}
            width={10}
            mask="999 999 9999"
            maskChar=""
            autoComplete="off"
            as={MaskedInput}
          />
          <SelectField
            id="businessStatus"
            name="businessStatus"
            label="Status"
            fieldOptions={convertCodingsToOptions(VALUE_SET_PRESCRIPTION_STATUS, true)}
          />
          <Fieldset>
            <Fieldset.Legend>Creation Date</Fieldset.Legend>
            <SelectField
              id="authoredOn.comparator"
              name="authoredOn.comparator"
              label="Search Type"
              error={errors.authoredOn?.comparator}
              fieldOptions={DATE_COMPARATOR_OPTIONS}
            />
            <DateInput
              id="authoredOn"
              name="authoredOn"
              error={errors.authoredOn?.day || errors.authoredOn?.month || errors.authoredOn?.year}
            >
              <Field id="authoredOn.day" name="authoredOn.day" as={DateInput.Day}/>
              <Field id="authoredOn.month" name="authoredOn.month" as={DateInput.Month}/>
              <Field id="authoredOn.year" name="authoredOn.year" as={DateInput.Year}/>
            </DateInput>
          </Fieldset>
          <ButtonList>
            <Button type="submit">Search</Button>
            <BackButton/>
          </ButtonList>
        </Form>
      )}
    </Formik>
  )
}

export default PrescriptionSearchForm

import * as React from "react"
import {Field, Formik, FormikErrors} from "formik"
import {Button, Form, Label, TextInput} from "nhsuk-react-components"
import ButtonList from "../common/buttonList"
import {PrescriptionSearchCriteria} from "../../common/prescription-search"
import {BackButton} from "../common/backButton"
import SelectField, {convertCodingsToOptions} from "../common/selectField"
import {VALUE_SET_PRESCRIPTION_STATUS} from "../../fhir/reference-data/valueSets"
import DateRangeField, {DATE_RANGE_INITIAL_VALUES, validateDateRangeField} from "./dateRangeField"

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
    authoredOn: DATE_RANGE_INITIAL_VALUES
  }

  const validate = (values: PrescriptionSearchCriteria) => {
    const errors: FormikErrors<PrescriptionSearchCriteria> = {}

    if (!values.prescriptionId && !values.patientId) {
      errors.prescriptionId = "One of Prescription ID or NHS Number is required"
      errors.patientId = "One of Prescription ID or NHS Number is required"
    }

    if (values.authoredOn) {
      const authoredOnErrors = validateDateRangeField(values.authoredOn)
      if (authoredOnErrors) {
        errors.authoredOn = authoredOnErrors
      }
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
            hint="Use the short form here, e.g. D7AC09-A99968-4BA59C"
            error={errors.prescriptionId}
            width={20}
            autoComplete="off"
            as={TextInput}
          />
          <Field
            id="patientId"
            name="patientId"
            label="NHS Number"
            error={errors.patientId}
            width={10}
            autoComplete="off"
            as={TextInput}
          />
          <SelectField
            id="businessStatus"
            name="businessStatus"
            label="Status"
            fieldOptions={convertCodingsToOptions(VALUE_SET_PRESCRIPTION_STATUS, true)}
          />
          <DateRangeField id="authoredOn" name="authoredOn" label="Creation Date"/>
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

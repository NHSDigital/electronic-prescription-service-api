import * as React from "react"
import {Field, Formik, FormikErrors} from "formik"
import {Button, Form, Label} from "nhsuk-react-components"
import {MaskedInput} from "nhsuk-react-components-extensions"
import ButtonList from "../buttonList"
import {PrescriptionSearchCriteria} from "../../pages/prescriptionSearchPage"
import {BackButton} from "../backButton"
import SelectField, {convertCodingsToOptions} from "../selectField"
import {VALUE_SET_PRESCRIPTION_STATUS} from "../../fhir/reference-data/valueSets"
import DateRangeField, {validateDateRangeField} from "./dateRangeField"

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
      type: ""
    }
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

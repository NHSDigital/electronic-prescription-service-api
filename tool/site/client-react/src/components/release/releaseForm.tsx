import * as React from "react"
import {Button, Form, Fieldset} from "nhsuk-react-components"
import {Formik} from "formik"
import ButtonList from "../../components/buttonList"
import BackButton from "../../components/backButton"
import PharmacyRadios from "./pharmacies"
import ReleaseType from "./releaseType"

interface ReleaseFormProps {
  prescriptionId?: string
  onSubmit: (values: ReleaseFormValues) => void
}

interface ReleaseFormErrors {
  releaseType?: string
  pharmacy?: string
}

const ReleaseForm: React.FC<ReleaseFormProps> = ({
  prescriptionId,
  onSubmit
}) => {
  const initialValues: ReleaseFormValues = getInitialValues(prescriptionId)

  const validate = (values: ReleaseFormValues) => {
    const errors: ReleaseFormErrors = {}
    if (isCustomRelease(values)) {
      populateAnyCustomReleaseErrors(values, errors)
      return errors
    }
    populateAnyPrescriptionIdErrors(values, errors)
    populateAnyPharmacyErrors(values, errors)
    populateAnyCustomPharmacyErrors(values, errors)
    return errors
  }

  return (
    <Formik<ReleaseFormValues> initialValues={initialValues} validate={validate} validateOnChange={false} validateOnBlur={false} onSubmit={values => onSubmit(values)}>
      {formik =>
        <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
          <Fieldset>
            <ReleaseType
              initialValue={initialValues.releaseType}
              value={formik.values.releaseType}
              error={formik.errors.releaseType}
            />
            {formik.values.releaseType !== "custom" &&
              <PharmacyRadios
                label="Pharmacy to release prescriptions to"
                value={formik.values.pharmacy}
                error={formik.errors.pharmacy}
              />
            }
          </Fieldset>
          <ButtonList>
            <Button type="submit">Release</Button>
            <BackButton/>
          </ButtonList>
        </Form>
      }
    </Formik>
  )
}

function getInitialValues(prescriptionId: string): ReleaseFormValues {
  return prescriptionId
    ? {releaseType: "prescriptionId", prescriptionId, pharmacy: "", customPharmacy: ""}
    : {releaseType: "all", prescriptionId: "", pharmacy: "", customPharmacy: ""}
}

function isCustomRelease(values: ReleaseFormValues) {
  return values.releaseType === "custom"
}

function populateAnyCustomReleaseErrors(values: ReleaseFormValues, errors: ReleaseFormErrors) {
  if (!values.customReleaseFhir) {
    errors.releaseType = "You must enter a FHIR release message when selecting 'With a FHIR release message'"
  }
}

function populateAnyPrescriptionIdErrors(values: ReleaseFormValues, errors: ReleaseFormErrors) {
  if (values.releaseType === "prescriptionId" && !values.prescriptionId) {
    errors.releaseType = "You must enter a 'Prescription ID' to release to when releasing a single prescription"
  }
}

function populateAnyPharmacyErrors(values: ReleaseFormValues, errors: ReleaseFormErrors) {
  if (!values.pharmacy) {
    errors.pharmacy = "You must select a pharmacy to release to"
  }
}

function populateAnyCustomPharmacyErrors(values: ReleaseFormValues, errors: ReleaseFormErrors) {
  if (values.pharmacy === "custom" && !values.customPharmacy) {
    errors.pharmacy = "You must enter a pharmacy ODS code to release to when selecting 'Other'"
  }
}

export default ReleaseForm

export interface ReleaseFormValues {
  releaseType: "all" | "prescriptionId" | "custom"
  prescriptionId?: string
  pharmacy: "" | "VNFKT" | "YGM1E" | "custom"
  customPharmacy?: string
  customReleaseFhir?: string
}

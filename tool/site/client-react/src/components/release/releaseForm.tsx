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
  const initialValues: ReleaseFormValues =
    prescriptionId
      ? {releaseType: "prescriptionId", prescriptionId, pharmacy: "", customPharmacy: ""}
      : {releaseType: "all", prescriptionId: "", pharmacy: "", customPharmacy: ""}

  const validate = (values: ReleaseFormValues) => {
    const errors: ReleaseFormErrors = {}

    if (values.releaseType === "custom") {
      if (!values.customReleaseFhir) {
        errors.releaseType = "You must enter a FHIR release message when selecting 'With a FHIR release message'"
      }
      return errors
    }

    if (values.releaseType === "prescriptionId" && !values.prescriptionId) {
      errors.releaseType = "You must enter a 'Prescription ID' to release to when releasing a single prescription"
    }
    if (!values.pharmacy) {
      errors.pharmacy = "You must select a pharmacy to release to"
    }
    if (values.pharmacy === "custom" && !values.customPharmacy) {
      errors.pharmacy = "You must enter a pharmacy ODS code to release to when selecting 'Other'"
    }

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

export default ReleaseForm

export interface ReleaseFormValues {
  releaseType: "all" | "prescriptionId" | "custom"
  prescriptionId?: string
  pharmacy: "" | "VNFKT" | "YGM1E" | "custom"
  customPharmacy?: string
  customReleaseFhir?: string
}

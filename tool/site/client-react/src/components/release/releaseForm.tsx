import * as React from "react"
import {Button, Form, Fieldset, Input, Textarea} from "nhsuk-react-components"
import {Field, Formik} from "formik"
import ButtonList from "../../components/buttonList"
import BackButton from "../../components/backButton"
import RadioField from "../../components/radioField"
import PharmacyRadios from "./pharmacies"

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
            <RadioField
              name="releaseType"
              label="Choose how you want to release prescription(s)"
              error={formik.errors.releaseType}
              fieldRadios={[
                {
                  value: "all",
                  text: "All nominated prescriptions for the below pharmacy",
                  defaultChecked: initialValues.releaseType === "all"
                },
                {
                  value: "prescriptionId",
                  text: "A single prescription by ID",
                  defaultChecked: initialValues.releaseType === "prescriptionId"
                },
                {
                  value: "custom",
                  text: "With a FHIR release message"
                }
              ]}
            />
            {formik.values.releaseType === "prescriptionId" &&
              <Field
                id="prescriptionId"
                name="prescriptionId"
                as={Input}
                width={30}
                label="Prescription ID"
              />
            }
            {formik.values.releaseType === "custom"
              ? <Field
                id="customReleaseFhir"
                name="customReleaseFhir"
                as={Textarea}
                rows={20}
                label="Paste a FHIR release message"
              />
              : <PharmacyRadios
                label="Pharmacy to release prescriptions to"
                error={formik.errors.pharmacy}
                showOdsCodeInput={formik.values.pharmacy === "custom"}
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

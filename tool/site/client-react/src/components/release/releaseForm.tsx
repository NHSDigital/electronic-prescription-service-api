import * as React from "react"
import {Button, Form, Fieldset, Input} from "nhsuk-react-components"
import {Field, Formik} from "formik"
import ButtonList from "../../components/buttonList"
import BackButton from "../../components/backButton"
import RadioField from "../../components/radioField"

interface ReleaseFormProps {
  prescriptionId?: string
  onSubmit: (values: ReleaseFormValues) => void
}

const ReleaseForm: React.FC<ReleaseFormProps> = ({
  prescriptionId,
  onSubmit
}) => {
  const initialValues: ReleaseFormValues =
    prescriptionId
      ? {releaseType: "prescriptionId", prescriptionId, releasePharmacy: null, customReleasePharmacy: null}
      : {releaseType: "all", prescriptionId: null, releasePharmacy: null, customReleasePharmacy: null}

  const validate = (values: ReleaseFormValues) => {
    const errors: ReleaseFormErrors = {}
    if (values.releaseType === "prescriptionId" && !values.prescriptionId) {
      errors.releaseType = "You must enter a 'Prescription ID' to release to when releasing a single prescription"
    }
    if (!values.releasePharmacy) {
      errors.releasePharmacy = "You must select a pharmacy to release to"
    }
    if (values.releasePharmacy === "custom" && !values.customReleasePharmacy) {
      errors.releasePharmacy = "You must enter a pharmacy ODS code to release to when selecting 'Other'"
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
                }
                // {
                //   value: "custom",
                //   text: "With a FHIR release message"
                // }
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
            <RadioField
              name="releasePharmacy"
              label="Pharmacy to release prescriptions to"
              error={formik.errors.releasePharmacy}
              fieldRadios={[
                {
                  value: "VNFKT",
                  text: "VNFKT - FIVE STAR HOMECARE LEEDS LTD"
                },
                {
                  value: "YGM1E",
                  text: "YGM1E - MBBM HEALTHCARE TECHNOLOGIES LTD"
                },
                {
                  value: "custom",
                  text: "Other"
                }
              ]}
            />
            {formik.values.releasePharmacy === "custom" &&
              <Field
                id="customReleasePharmacy"
                name="customReleasePharmacy"
                as={Input}
                width={30}
                label="Enter an ODS Code"
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
  releaseType: "all" | "prescriptionId",
  prescriptionId?: string
  releasePharmacy: "VNFKT" | "YGM1E" | "custom"
  customReleasePharmacy?: string
}

interface ReleaseFormErrors {
  releaseType?: string
  releasePharmacy?: string
}

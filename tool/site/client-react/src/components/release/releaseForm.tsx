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
      ? {releaseType: "prescriptionId", releasePharmacy: null, prescriptionId}
      : {releaseType: "all", releasePharmacy: null, prescriptionId: null}

  const validate = (values: ReleaseFormValues) => {
    const errors: ReleaseFormErrors = {}
    if (!values.releasePharmacy) {
      errors.releasePharmacy = "You must select a pharmacy to release to"
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
                label="Prescription Id"
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
                }
                // {
                //   value: "custom",
                //   text: "Other"
                // }
              ]}
            />
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
  releaseType: string,
  releasePharmacy: string
  prescriptionId: string
}

interface ReleaseFormErrors {
  releasePharmacy?: string
}

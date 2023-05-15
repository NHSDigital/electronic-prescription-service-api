import * as React from "react"
import {Button, Form, Fieldset} from "nhsuk-react-components"
import {Formik} from "formik"
import ButtonList from "../common/buttonList"
import BackButton from "../common/backButton"
import RadioField from "../common/radioField"

interface CancelFormProps {
  prescriptionId?: string
  medications: Array<any>
  onSubmit: (values: CancelFormValues) => void
}

const CancelForm: React.FC<CancelFormProps> = ({
  medications,
  onSubmit
}) => {
  const initialValues: CancelFormValues = getInitialValues()
  return (
    <Formik<CancelFormValues> initialValues={initialValues} onSubmit={values => onSubmit(values)}>
      {formik =>
        <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
          <Fieldset>
            <RadioField
              name="cancellationReason"
              label="Choose a reason for cancellation"
              defaultValue={initialValues.cancellationReason}
              fieldRadios={cancellationReasons}
            />
            <RadioField
              name="cancellationUser"
              label="Choose a cancellation user"
              defaultValue={initialValues.cancellationUser}
              fieldRadios={cancellationUsers}
            />
            <RadioField
              name="cancellationMedication"
              label="Choose a medication to cancel"
              fieldRadios={medications}
            />
          </Fieldset>
          <ButtonList>
            <Button type="submit">Cancel</Button>
            <BackButton/>
          </ButtonList>
        </Form>
      }
    </Formik>
  )
}

function getInitialValues(): CancelFormValues {
  return {
    cancellationReason: "0001",
    cancellationUser: "sameAsOriginalAuthor",
    cancellationMedication: ""
  }
}

export const cancellationReasons = [
  {
    value: "0001",
    text: "Prescribing Error"
  },
  {
    value: "0002",
    text: "Clinical contra-indication"
  },
  {
    value: "0003",
    text: "Change to medication treatment regime"
  },
  {
    value: "0004",
    text: "Clinical grounds"
  },
  {
    value: "0005",
    text: "At the Patient's request"
  },
  {
    value: "0006",
    text: "At the Pharmacist's request"
  },
  {
    value: "0007",
    text: "Notification of Death"
  },
  {
    value: "0008",
    text: "Patient deducted - other reason"
  },
  {
    value: "0009",
    text: "Patient deducted - registered with new practice"
  }
].map(reason => ({...reason, id: parseInt(reason.value)}))

const cancellationUsers = [
  {
    value: "sameAsOriginalAuthor",
    text: "Use original author"
  },
  {
    value: "S8006:G8006:R8006",
    text: "Admin - Medical Secretary Access Role"
  }
].map((user, index) => ({...user, id: index}))

export default CancelForm

export interface CancelFormValues {
  cancellationReason: string
  cancellationUser: string
  cancellationMedication: string
}

export interface MedicationRadio {
  value: string
  text: string
}

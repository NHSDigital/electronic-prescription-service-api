import * as React from "react"
import {TextInput, Textarea} from "nhsuk-react-components"
import {Field} from "formik"
import RadioField from "../common/radioField"

interface ReleaseTypeProps {
  initialValue: string
  value: string
  error?: string
}

const ReleaseType: React.FC<ReleaseTypeProps> = ({
  initialValue,
  value,
  error
}) => {
  return (
    <>
      <RadioField
        name="releaseType"
        label="Choose how you want to release prescription(s)"
        defaultValue={initialValue}
        error={error}
        fieldRadios={[
          {
            id: 0,
            value: "all",
            text: "All nominated prescriptions for the below pharmacy"
          },
          {
            id: 1,
            value: "prescriptionId",
            text: "A single prescription by ID"
          },
          {
            id: 2,
            value: "custom",
            text: "With a FHIR release message"
          }
        ]}
      />
      {value === "prescriptionId" &&
        <Field
          id="prescriptionId"
          name="prescriptionId"
          as={TextInput}
          width={30}
          label="Prescription ID"
        />
      }
      {value === "custom" &&
        <Field
          id="customReleaseFhir"
          name="customReleaseFhir"
          as={Textarea}
          rows={20}
          label="Paste a FHIR release message"
        />
      }
    </>
  )
}

export default ReleaseType

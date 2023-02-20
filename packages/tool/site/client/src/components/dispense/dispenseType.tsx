import * as React from "react"
import {Textarea} from "nhsuk-react-components"
import {Field} from "formik"
import RadioField from "../common/radioField"

interface DispenseTypeProps {
  initialValue: string
  value: string
  error?: string
}

const DispenseType: React.FC<DispenseTypeProps> = ({
  initialValue,
  value,
  error
}) => {
  return (
    <>
      <RadioField
        name="dispenseType"
        label="Choose how you want to dispense this prescription"
        defaultValue={initialValue}
        error={error}
        fieldRadios={[
          {
            value: "form",
            text: "Use the dispense prescription form"
          },
          {
            value: "custom",
            text: "With a FHIR dispense message"
          }
        ]}
      />
      {value === "custom" &&
        <Field
          id="customDispenseFhir"
          name="customDispenseFhir"
          as={Textarea}
          rows={20}
          label="Paste a FHIR dispense message"
        />
      }
    </>
  )
}

export default DispenseType

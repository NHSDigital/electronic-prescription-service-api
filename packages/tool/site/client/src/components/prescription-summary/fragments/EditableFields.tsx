import {Field} from "formik"
import {TextInput, Label} from "nhsuk-react-components"
import React from "react"

const NumberOfCopiesField = ({errors}: { errors?: string }) => (
  <div style={{float: "right", width: "300px"}}>
    <Label>How many copies do you want?</Label>
    <Field
      id="numberOfCopies"
      name="numberOfCopies"
      as={TextInput}
      width={500}
      error={errors} />
  </div>
)

export {
  NumberOfCopiesField
}

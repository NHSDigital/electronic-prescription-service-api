import * as React from "react"
import {Field, Formik} from "formik"
import {Button, Form, Label} from "nhsuk-react-components"
import {MaskedInput} from "nhsuk-react-components-extensions"
import ButtonList from "../buttonList"
import {PrescriptionSearchCriteria} from "../../pages/prescriptionSearchPage"
import {BackButton} from "../backButton"

interface PrescriptionSearchFormProps {
  prescriptionId: string,
  onSubmit: (values: PrescriptionSearchCriteria) => void
}

const PrescriptionSearchForm: React.FC<PrescriptionSearchFormProps> = ({
  prescriptionId,
  onSubmit
}) => {
  const initialValues = {
    prescriptionId: prescriptionId ?? "",
    patientId: ""
  }
  return (
    <Formik<PrescriptionSearchCriteria> initialValues={initialValues} onSubmit={onSubmit}>
      {formik => (
        <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
          <Label isPageHeading>Search for a Prescription</Label>
          <Field
            id="prescriptionId"
            name="prescriptionId"
            label="Prescription ID"
            hint="Use the short form here, e.g. E3E6FA-A83008-41F09Y"
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
            width={10}
            mask="999 999 9999"
            maskChar=""
            autoComplete="off"
            as={MaskedInput}
          />
          <ButtonList>
            <Button type="submit">Search</Button>
            <BackButton />
          </ButtonList>
        </Form>
      )}
    </Formik>
  )
}

export default PrescriptionSearchForm

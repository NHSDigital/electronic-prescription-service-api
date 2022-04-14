import * as React from "react"
import {Button, Form, Fieldset, Textarea} from "nhsuk-react-components"
import {Field, Formik} from "formik"
import ButtonList from "../common/buttonList"
import BackButton from "../common/backButton"

interface DoseToTextFormProps {
  initialValues?: DoseToTextFormValues
  onSubmit: (values: DoseToTextFormValues) => void
}

export interface DoseToTextFormValues {
  doseToTextRequest: string
}

const DoseToTextForm: React.FC<DoseToTextFormProps> = ({
  initialValues,
  onSubmit
}) => {
  return (
    <Formik<DoseToTextFormValues> initialValues={initialValues} onSubmit={values => onSubmit(values)}>
      {formik =>
        <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
          <Fieldset>
            <Field
              id="doseToTextRequest"
              name="doseToTextRequest"
              as={Textarea}
              rows={20}
            />
          </Fieldset>
          <ButtonList>
            <Button type="submit">Convert</Button>
            <BackButton/>
          </ButtonList>
        </Form>
      }
    </Formik>
  )
}

export default DoseToTextForm

import * as React from "react"
import {Button, Form, Fieldset, Textarea} from "nhsuk-react-components"
import {Field, Formik} from "formik"
import ButtonList from "../../components/buttonList"
import BackButton from "../../components/backButton"

interface VerifyFormProps {
  initialValues?: VerifyFormValues
  onSubmit: (values: VerifyFormValues) => void
}

export interface VerifyFormValues {
  verifyRequest: string
}

const VerifyForm: React.FC<VerifyFormProps> = ({
  initialValues,
  onSubmit
}) => {
  return (
    <Formik<VerifyFormValues> initialValues={initialValues} onSubmit={values => onSubmit(values)}>
      {formik =>
        <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
          <Fieldset>
            <Field
              id="verifyRequest"
              name="verifyRequest"
              as={Textarea}
              rows={20}
            />
          </Fieldset>
          <ButtonList>
            <Button type="submit">Verify</Button>
            <BackButton/>
          </ButtonList>
        </Form>
      }
    </Formik>
  )
}

export default VerifyForm

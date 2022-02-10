import * as React from "react"
import {useContext, useState} from "react"
import {Label, Button, Fieldset, Form, Checkboxes, Input} from "nhsuk-react-components"
import {AppContext} from "../index"
import ButtonList from "../components/buttonList"
import {Field, Formik} from "formik"
import {axiosInstance} from "../requests/axiosInstance"

interface ConfigFormValues {
  useSigningMock: boolean
  signingPrNumber: string
}

const ConfigPage: React.FC = () => {
  const {baseUrl} = useContext(AppContext)
  const [configFormValues, setConfigFormValues] = useState<ConfigFormValues>()
  const initialValues = {useSigningMock: false, signingPrNumber: undefined}

  if (configFormValues) {
    const result = axiosInstance.post(`${baseUrl}config`, configFormValues)
    result.then(result => console.log(result.data))
  }

  return (
    <>
      <Label isPageHeading>Config</Label>
      <Formik<ConfigFormValues> initialValues={initialValues} onSubmit={setConfigFormValues}>
        {formik =>
          <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
            <Label bold>Signing</Label>
            <Fieldset>
              <Checkboxes>
                <Field id="useSigningMock" name="useSigningMock" type="checkbox" as={Checkboxes.Box}>
                  Use Signing Mock
                </Field>
              </Checkboxes>
              {!formik.values.useSigningMock &&
                <Field
                  id="signingPrNumber"
                  name="signingPrNumber"
                  as={Input}
                  width={30}
                  label="Signing PR Number"
                />
              }
            </Fieldset>
            <ButtonList>
              <Button type="submit">Save</Button>
            </ButtonList>
          </Form>
        }
      </Formik>
    </>
  )
}

export default ConfigPage

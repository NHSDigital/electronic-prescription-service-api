import * as React from "react"
import {useContext, useEffect, useState} from "react"
import {Label, Button, Fieldset, Form, Checkboxes, Input, CrossIcon, TickIcon} from "nhsuk-react-components"
import {AppContext} from "../index"
import ButtonList from "../components/buttonList"
import {Field, Formik} from "formik"
import {axiosInstance} from "../requests/axiosInstance"
import BackButton from "../components/backButton"

interface ConfigFormValues {
  useSigningMock: boolean
  signingPrNumber: string
}

const ConfigPage: React.FC = () => {
  const {baseUrl} = useContext(AppContext)
  const [configFormValues, setConfigFormValues] = useState<ConfigFormValues>()
  const [configUpdateSuccess, setConfigUpdateSuccess] = useState(undefined)
  const initialValues = {useSigningMock: false, signingPrNumber: undefined}

  useEffect(() => {
    if (configFormValues) {
      (async () => {
        const success = await updateConfig(baseUrl, configFormValues)
        setConfigUpdateSuccess(success)
      })()
    }
  }, [baseUrl, configFormValues, setConfigUpdateSuccess])

  if (configUpdateSuccess !== undefined) {
    return <>
      <Label isPageHeading>Config Saved {configUpdateSuccess ? <TickIcon/> : <CrossIcon/>}</Label>
      <ButtonList>
        <BackButton/>
      </ButtonList>
    </>
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

async function updateConfig(baseUrl: string, configFormValues: ConfigFormValues): Promise<boolean> {
  return await (await axiosInstance.post(`${baseUrl}config`, configFormValues)).data.success
}

export default ConfigPage

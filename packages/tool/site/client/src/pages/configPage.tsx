import * as React from "react"
import {useContext, useState, useEffect, useCallback} from "react"
import {Label, Button, Fieldset, Form, Checkboxes, TextInput} from "nhsuk-react-components"
import {AppContext} from "../index"
import ButtonList from "../components/common/buttonList"
import {Field, Formik} from "formik"
import {axiosInstance} from "../requests/axiosInstance"
import BackButton from "../components/common/backButton"
import SuccessOrFail from "../components/common/successOrFail"
import { isInternalDev, isInternalDevSandbox, isQa } from "../services/environment"

interface ConfigFormValues {
  useSigningMock: boolean
  useProxygen: boolean
  epsPrNumber: string
  signingPrNumber: string
}

interface ConfigResponse {
  success: boolean
}

interface ConfigDetails {
  useSigningMock: boolean,
  epsPrNumber: string,
  signingPrNumber: string,
  useProxygen: boolean
}

const ConfigPage: React.FC = () => {
  const {baseUrl, environment} = useContext(AppContext)
  const [configUpdateSuccess, setConfigUpdateSuccess] = useState(undefined)
  const [configValues, setConfigValues] = useState({useSigningMock: false, epsPrNumber: "", signingPrNumber: "", useProxygen: false})
  const initialValues = {
    useSigningMock: configValues.useSigningMock,
    epsPrNumber: configValues.epsPrNumber,
    signingPrNumber: configValues.signingPrNumber,
    useProxygen: configValues.useProxygen
  }
  const isDevOrQa = isInternalDev(environment) || isInternalDevSandbox(environment) || isQa(environment)
  

  useEffect(() => {
    axiosInstance.get(`${baseUrl}getconfig`)
      .then(response => {
        if (response.status === 200) {
          const configDetails = response.data
          if (configDetails.hasOwnProperty("useSigningMock") && 
          configDetails.hasOwnProperty("epsPrNumber") &&
          configDetails.hasOwnProperty("signingPrNumber") && 
          configDetails.hasOwnProperty("useProxygen")) {
            setConfigValues(response.data)
          }
        }
      })
  }, [])

  if (configUpdateSuccess !== undefined) {
    return <>
      <Label isPageHeading>Config Saved {<SuccessOrFail condition={configUpdateSuccess} />}</Label>
      <ButtonList>
        <BackButton/>
      </ButtonList>
    </>
  }


  return (
    <>
      <Label isPageHeading>Config</Label>
      <Formik<ConfigFormValues>
        initialValues={initialValues}
        onSubmit={values => updateConfig(baseUrl, values, setConfigUpdateSuccess)}
        enableReinitialize={true}> 
        {formik =>
          <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
            <Label bold>EPS</Label>
            <Fieldset>
              {isDevOrQa &&
                <Field
                  id="epsPrNumber"
                  name="epsPrNumber"
                  as={TextInput}
                  width={30}
                  label="EPS PR Number"
                />
              }
              <Label bold>Use Proxygen</Label>
              <Checkboxes id="useProxygen">
                <Field id="useProxygen" name="useProxygen" type="checkbox" as={Checkboxes.Box}>
                  Use Proxygen deployed APIs
                </Field>
              </Checkboxes>
              {isDevOrQa && 
                <Label bold>Signing</Label>
              }

              {isDevOrQa && 
                <Checkboxes id="useSigningMockCheckboxes">
                  <Field id="useSigningMock" name="useSigningMock" type="checkbox" as={Checkboxes.Box}>
                    Use Signing Mock
                  </Field>
                </Checkboxes>
              }
              {!formik.values.useSigningMock && isDevOrQa &&
                <Field
                  id="signingPrNumber"
                  name="signingPrNumber"
                  as={TextInput}
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

async function updateConfig(
  baseUrl: string,
  configFormValues: ConfigFormValues,
  setConfigUpdateSuccess: React.Dispatch<boolean>
): Promise<void> {
  const success = (await axiosInstance.post<ConfigResponse>(`${baseUrl}config`, configFormValues)).data.success
  setConfigUpdateSuccess(success)
}

export default ConfigPage

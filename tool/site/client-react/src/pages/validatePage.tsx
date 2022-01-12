import * as React from "react"
import {useContext, useState} from "react"
import {Label, TickIcon, CrossIcon, Form, Fieldset, Button, Textarea} from "nhsuk-react-components"
import {AppContext} from "../index"
import ButtonList from "../components/buttonList"
import LongRunningTask from "../components/longRunningTask"
import MessageExpanders from "../components/messageExpanders"
import ReloadButton from "../components/reloadButton"
import {axiosInstance} from "../requests/axiosInstance"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {ApiResult, isApiResult} from "../requests/apiResult"
import {Field, Formik} from "formik"
import BackButton from "../components/backButton"
import styled from "styled-components"

export interface ValidateFormValues {
  validatePayload: string
}

const StyledButtonList = styled(ButtonList)`
  margin-top: 24px;
`

const ValidatePage: React.FC = () => {
  const {baseUrl} = useContext(AppContext)
  const [validateFormValues, setValidateFormValues] = useState<ValidateFormValues>({validatePayload: ""})
  if (!validateFormValues.validatePayload) {
    return (
      <>
        <Label isPageHeading>Validate a FHIR Resource</Label>
        <Formik<ValidateFormValues> initialValues={validateFormValues} onSubmit={setValidateFormValues}>
          {formik =>
            <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
              <Fieldset>
                <Field
                  id="validatePayload"
                  name="validatePayload"
                  as={Textarea}
                  rows={20}
                />
              </Fieldset>
              <StyledButtonList>
                <Button type="submit">Validate</Button>
                <BackButton/>
              </StyledButtonList>
            </Form>
          }
        </Formik>
      </>
    )
  }
  const sendValidateMessage = () => sendValidate(baseUrl, validateFormValues)
  return (
    <LongRunningTask<ApiResult> task={sendValidateMessage} loadingMessage="Sending validation request.">
      {validateResult => (
        <>
          <Label isPageHeading>Validate Result {validateResult.success ? <TickIcon/> : <CrossIcon/>}</Label>
          <MessageExpanders
            fhirRequest={validateResult.request}
            fhirResponse={validateResult.response}
          />
          <ButtonList>
            <ReloadButton/>
          </ButtonList>
        </>
      )}
    </LongRunningTask>
  )
}

async function sendValidate(
  baseUrl: string,
  validateFormValues: ValidateFormValues
): Promise<ApiResult> {
  const validateResponse =
    await axiosInstance.post<ApiResult>(
      `${baseUrl}validate`,
      JSON.parse(validateFormValues.validatePayload))
  return getResponseDataIfValid(validateResponse, isApiResult)
}

export default ValidatePage

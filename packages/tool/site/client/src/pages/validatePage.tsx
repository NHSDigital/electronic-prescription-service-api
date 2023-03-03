import * as React from "react"
import {Label, Form, Fieldset, Button, Textarea} from "nhsuk-react-components"
import {AppContext} from "../index"
import ButtonList from "../components/common/buttonList"
import LongRunningTask from "../components/common/longRunningTask"
import MessageExpanders from "../components/messageExpanders"
import ReloadButton from "../components/common/reloadButton"
import {axiosInstance} from "../requests/axiosInstance"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {ApiResult, isApiResult} from "../requests/apiResult"
import {Field, Formik} from "formik"
import BackButton from "../components/common/backButton"
import styled from "styled-components"
import SuccessOrFail from "../components/common/successOrFail"

export interface ValidateFormValues {
  validatePayload: string
}

const StyledFieldset = styled(Fieldset)`
  margin-bottom: 24px;
`

const ValidatePage: React.FC = () => {
  const {baseUrl} = React.useContext(AppContext)
  const [validateFormValues, setValidateFormValues] = React.useState<ValidateFormValues>({validatePayload: ""})
  if (!validateFormValues.validatePayload) {
    return (
      <>
        <Label isPageHeading>Validate a FHIR Resource</Label>
        <Formik<ValidateFormValues> initialValues={validateFormValues} onSubmit={setValidateFormValues}>
          {formik =>
            <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
              <StyledFieldset>
                <Field
                  id="validatePayload"
                  name="validatePayload"
                  as={Textarea}
                  rows={20}
                />
              </StyledFieldset>
              <ButtonList>
                <Button type="submit">Validate</Button>
                <BackButton/>
              </ButtonList>
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
          <Label isPageHeading>Validate Result {<SuccessOrFail condition={validateResult.success} />}</Label>
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

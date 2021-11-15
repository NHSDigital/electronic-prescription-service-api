import * as React from "react"
import {useContext} from "react"
import {Button, CrossIcon, Label, SummaryList, TickIcon} from "nhsuk-react-components"
import MessageExpanders from "../components/messageExpanders"
import ButtonList from "../components/buttonList"
import LongRunningTask from "../components/longRunningTask"
import {AppContext} from "../index"
import PrescriptionActions from "../components/prescriptionActions"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {axiosInstance} from "../requests/axiosInstance"
import {isResult, Result} from "../requests/result"
import {getArrayTypeGuard} from "../fhir/typeGuards"

interface SendPageProps {
  token: string
}

const SendPostSignPage: React.FC<SendPageProps> = ({
  token
}) => {
  const {baseUrl} = useContext(AppContext)
  const sendPrescriptionTask = () => sendPrescription(baseUrl, token)
  return (
    <LongRunningTask<SendResult> task={sendPrescriptionTask} message="Sending prescription.">
      {sendResult => (
        <>
          <Label isPageHeading>Send Result {sendResult.success ? <TickIcon/> : <CrossIcon/>}</Label>
          <SummaryList>
            <SummaryList.Row>
              <SummaryList.Key>ID</SummaryList.Key>
              <SummaryList.Value>{sendResult.prescription_id}</SummaryList.Value>
            </SummaryList.Row>
          </SummaryList>
          <PrescriptionActions prescriptionId={sendResult.prescription_id} cancel release dispense claim view/>
          <MessageExpanders
            fhirRequest={sendResult.request}
            hl7V3Request={sendResult.request_xml}
            fhirResponse={sendResult.response}
            hl7V3Response={sendResult.response_xml}
          />
          <ButtonList>
            <Button type="button" href={baseUrl} secondary>Back</Button>
          </ButtonList>
        </>
      )}
    </LongRunningTask>
  )
}

async function sendPrescription(baseUrl: string, token: string): Promise<SendResult> {
  const request = {signatureToken: token}
  const response = await axiosInstance.post<SendResult>(`${baseUrl}prescribe/send`, request)
  return getResponseDataIfValid(response, isSendResult)
}

interface SendResult extends Result {
  prescription_ids: string[]
  prescription_id: string
}

/**
 * Not sure this is correct. Split single and bulk send?
 */
function isSendResult(data: unknown): data is SendResult {
  if (!isResult(data)) {
    return false
  }
  const sendResult = data as SendResult
  return isString(sendResult.prescription_id)
    || getArrayTypeGuard(isString)(sendResult.prescription_ids)
}

function isString(data: unknown): data is string {
  return typeof data === "string"
}

export default SendPostSignPage

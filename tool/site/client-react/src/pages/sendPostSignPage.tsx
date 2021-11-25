import * as React from "react"
import {useContext} from "react"
import {Button, CrossIcon, Label, SummaryList, Table, TickIcon} from "nhsuk-react-components"
import MessageExpanders from "../components/messageExpanders"
import ButtonList from "../components/buttonList"
import LongRunningTask from "../components/longRunningTask"
import {AppContext} from "../index"
import PrescriptionActions from "../components/prescriptionActions"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {axiosInstance} from "../requests/axiosInstance"
import {isResult, Result} from "../requests/result"
import BackButton from "../components/backButton"

interface SendPostSignPageProps {
  token: string
}

const SendPostSignPage: React.FC<SendPostSignPageProps> = ({
  token
}) => {
  const {baseUrl} = useContext(AppContext)
  const sendPrescriptionTask = () => sendPrescription(baseUrl, token)
  return (
    <LongRunningTask<SendResult | SendBulkResult> task={sendPrescriptionTask} loadingMessage="Sending prescription(s).">
      {sendResult => {
        if (isBulkResult(sendResult)) {
          return <>
            <Label isPageHeading>Send Results</Label>
            <ButtonList>
              <Button onClick={() => copyPrescriptionIds(sendResult)}>Copy Prescription IDs</Button>
            </ButtonList>
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Cell>ID</Table.Cell>
                  <Table.Cell>Success</Table.Cell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {sendResult.results.map(result => (
                  <Table.Row key={result.prescription_id}>
                    <Table.Cell>{result.prescription_id}</Table.Cell>
                    <Table.Cell>{result.success ? <TickIcon/> : <CrossIcon/>}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </>
        }
        return (
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
              <BackButton/>
            </ButtonList>
          </>
        )
      }}
    </LongRunningTask>
  )
}

async function sendPrescription(baseUrl: string, token: string): Promise<SendResult | SendBulkResult> {
  const request = {signatureToken: token}
  const response = await axiosInstance.post<SendResult | SendBulkResult>(`${baseUrl}prescribe/send`, request)
  return getResponseDataIfValid(response, isSendResultOrSendBulkResult)
}

function isSendResultOrSendBulkResult(data: unknown): data is SendResult | SendBulkResult {
  if (isBulkResult(data as SendBulkResult)) {
    return true
  }
  if (!isResult(data)) {
    return false
  }
  const sendResult = data as SendResult
  return typeof sendResult.prescription_id === "string"
}

function isBulkResult(response: SendResult | SendBulkResult): response is SendBulkResult {
  return (response as SendBulkResult).results !== undefined
}

interface SendResult extends Result {
  prescription_id: string
}

interface SendBulkResult {
  results: Array<SendBulkResultDetail>
}

interface SendBulkResultDetail {
  prescription_id: string
  success: boolean
}

interface SendBulkResult {
  results: Array<SendBulkResultDetail>
}

interface SendBulkResultDetail {
  prescription_id: string
  success: boolean
}

function copyPrescriptionIds(sendBulkResult: SendBulkResult) {
  const prescriptionIds = sendBulkResult.results.map(r => r.prescription_id)
  navigator.clipboard.writeText(prescriptionIds.join("\n"))
}

export default SendPostSignPage

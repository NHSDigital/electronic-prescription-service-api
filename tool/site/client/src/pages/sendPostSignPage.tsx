import * as React from "react"
import {useContext} from "react"
import {Button, CrossIcon, Label, SummaryList, Table, TickIcon} from "nhsuk-react-components"
import MessageExpanders from "../components/messageExpanders"
import ButtonList from "../components/common/buttonList"
import LongRunningTask from "../components/common/longRunningTask"
import {AppContext} from "../index"
import PrescriptionActions from "../components/common/prescriptionActions"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {axiosInstance} from "../requests/axiosInstance"
import {isApiResult, ApiResult} from "../requests/apiResult"
import BackButton from "../components/common/backButton"
import {isRedirect, redirect, Redirect} from "../browser/navigation"

interface SendPostSignPageProps {
  token: string
  state?: string
}

const SendPostSignPage: React.FC<SendPostSignPageProps> = ({
  token,
  state
}) => {
  const {baseUrl} = useContext(AppContext)
  const sendPrescriptionTask = () => sendPrescription(baseUrl, token, state)
  return (
    <LongRunningTask<SendResult | SendBulkResult | Redirect> task={sendPrescriptionTask} loadingMessage="Sending prescription(s).">
      {sendResult => {
        if (isRedirect(sendResult)) {
          return null
        }
        if (isBulkResult(sendResult)) {
          return <>
            <Label isPageHeading>Send Results</Label>
            <ButtonList>
              <Button onClick={() => copyPrescriptionIds(sendResult)}>Copy Prescription IDs</Button>
              <Button href={`${baseUrl}download/exception-report`}>Download Exception Report</Button>
            </ButtonList>
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Cell>Bundle ID</Table.Cell>
                  <Table.Cell>Prescription ID</Table.Cell>
                  <Table.Cell>Success</Table.Cell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {sendResult.results.map(result => (
                  <Table.Row key={result.prescription_id}>
                    <Table.Cell>{result.bundle_id}</Table.Cell>
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
            <PrescriptionActions prescriptionId={sendResult.prescription_id} cancel release view/>
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

async function sendPrescription(
  baseUrl: string,
  token: string,
  state?: string
): Promise<SendResult | SendBulkResult | Redirect> {
  const request = {signatureToken: token, state}
  const response = await axiosInstance.post<SendResult | SendBulkResult | Redirect>(`${baseUrl}prescribe/send`, request)
  if (isRedirect(response.data)) {
    redirect(response.data.redirectUri)
    return response.data
  }
  return getResponseDataIfValid(response, isSendResultOrSendBulkResult)
}

function isSendResultOrSendBulkResult(data: unknown): data is SendResult | SendBulkResult | Redirect {
  if (isBulkResult(data as SendBulkResult)) {
    return true
  }
  if (!isApiResult(data)) {
    return false
  }
  const sendResult = data as SendResult
  return typeof sendResult.prescription_id === "string"
}

function isBulkResult(response: SendResult | SendBulkResult): response is SendBulkResult {
  return (response as SendBulkResult).results !== undefined
}

interface SendResult extends ApiResult {
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
  bundle_id: string
  success: boolean
}

function copyPrescriptionIds(sendBulkResult: SendBulkResult) {
  const prescriptionIds = sendBulkResult.results.map(r => r.prescription_id)
  navigator.clipboard.writeText(prescriptionIds.join("\n"))
}

export default SendPostSignPage

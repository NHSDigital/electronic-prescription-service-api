import * as React from "react"
import {useContext} from "react"
import {Button, CrossIcon, Label, SummaryList, Table, TickIcon} from "nhsuk-react-components"
import axios from "axios"
import * as fhir from "fhir/r4"
import MessageExpanders from "../components/messageExpanders"
import ButtonList from "../components/buttonList"
import LongRunningTask from "../components/longRunningTask"
import {AppContext} from "../index"
import PrescriptionActions from "../components/prescriptionActions"

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
              <Button
                onClick={() => navigator.clipboard.writeText(sendResult.results.map(r => r.prescription_id).join("\n"))}>Copy
                Prescription IDs</Button>
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
              <Button type="button" href={baseUrl} secondary>Back</Button>
            </ButtonList>
          </>
        )
      }}
    </LongRunningTask>
  )
}

async function sendPrescription(baseUrl: string, token: string): Promise<SendResult> {
  const request = {signatureToken: token}
  const response = await axios.post<SendResult>(`${baseUrl}prescribe/send`, request)
  return response.data
}

function isBulkResult(response: SendResult | SendBulkResult): response is SendBulkResult {
  return (response as SendBulkResult).results !== undefined
}

interface SendResult {
  prescription_id: string
  success: boolean
  request: fhir.Bundle
  request_xml: string
  response: fhir.OperationOutcome
  response_xml: string
}

interface SendBulkResult {
  results: Array<SendBulkResultDetail>
}

interface SendBulkResultDetail {
  prescription_id: string
  success: boolean
}

export default SendPostSignPage

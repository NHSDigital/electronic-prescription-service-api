import * as React from "react"
import {useEffect, useState} from "react"
import {ActionLink, Button, CrossIcon, ErrorMessage, Label, SummaryList, Table, TickIcon} from "nhsuk-react-components"
import axios from "axios"
import * as fhir from "fhir/r4"
import MessageExpanders from "../components/messageExpanders"
import ButtonList from "../components/buttonList"

interface SendPageProps {
  baseUrl: string
  token: string
}

const SendPage: React.FC<SendPageProps> = ({
  baseUrl,
  token
}) => {
  const [loadingMessage, setLoadingMessage] = useState<string>("Loading page.")
  const [errorMessage, setErrorMessage] = useState<string>()
  const [sendResult, setSendResult] = useState<SendResult>()
  const [sendBulkResult, setSendBulkResult] = useState<SendBulkResult>()

  useEffect(() => {
    if (!sendResult) {
      sendPrescription().catch(error => {
        console.log(error)
        setErrorMessage("Failed to send or retrieve sent prescription details.")
      })
    }
  }, [sendResult])

  async function sendPrescription(): Promise<void> {
    setLoadingMessage("Sending prescription(s).")

    const request = {signatureToken: token}
    const response = await axios.post<SendResult | SendBulkResult>(`${baseUrl}prescribe/send`, request)
    console.log(request)
    console.log(response)

    if (isBulkResult(response.data)) {
      setSendBulkResult(response.data)
    } else {
      setSendResult(response.data)
    }
    setLoadingMessage(undefined)
  }

  function isBulkResult(response: SendResult | SendBulkResult): response is SendBulkResult {
    return (response as SendBulkResult).results !== undefined
  }

  if (errorMessage) {
    return <>
      <Label isPageHeading>Error</Label>
      <ErrorMessage>{errorMessage}</ErrorMessage>
    </>
  }

  if (loadingMessage) {
    return <>
      <Label isPageHeading>Loading...</Label>
      <Label>{loadingMessage}</Label>
    </>
  }

  if (sendBulkResult) {
    return <>
      <Label isPageHeading>Send Results</Label>
      <ButtonList>
        <Button onClick={() => navigator.clipboard.writeText(sendBulkResult.prescription_ids.join("\n"))}>Copy Prescription IDs</Button>
      </ButtonList>
      <Table>
        <Table.Head>
          <Table.Row>
            <Table.Cell>ID</Table.Cell>
            <Table.Cell>Success</Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {sendBulkResult.results.map(result => (
            <Table.Row key={result.prescription_id}>
              <Table.Cell>{result.prescription_id}</Table.Cell>
              <Table.Cell>{result.success ? <TickIcon/> : <CrossIcon/>}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </>
  }

  if (sendResult) {
    return <>
      <Label isPageHeading>Send Result {sendResult.success ? <TickIcon/> : <CrossIcon/>}</Label>
      <SummaryList>
        <SummaryList.Row>
          <SummaryList.Key>ID</SummaryList.Key>
          <SummaryList.Value>{sendResult.prescription_id}</SummaryList.Value>
        </SummaryList.Row>
      </SummaryList>
      <ActionLink href={`${baseUrl}dispense/release?prescription_id=${sendResult.prescription_id}`}>
        Release this prescription
      </ActionLink>
      <ActionLink href={`${baseUrl}dispense/dispense?prescription_id=${sendResult.prescription_id}`}>
        Dispense this prescription
      </ActionLink>
      <ActionLink href={`${baseUrl}dispense/claim?prescription_id=${sendResult.prescription_id}`}>
        Claim for this prescription
      </ActionLink>
      <ActionLink href={`${baseUrl}prescribe/cancel?prescription_id=${sendResult.prescription_id}`}>
        Cancel this prescription
      </ActionLink>
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
  }

  return <>
    <Label isPageHeading>Error</Label>
    <ErrorMessage>An unknown error occurred.</ErrorMessage>
  </>
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

export default SendPage

import * as React from "react"
import {useEffect, useState} from "react"
import {ActionLink, Button, CrossIcon, ErrorMessage, Label, SummaryList, TickIcon} from "nhsuk-react-components"
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

  useEffect(() => {
    if (!sendResult) {
      sendPrescription().catch(error => {
        console.log(error)
        setErrorMessage("Failed to send or retrieve sent prescription details.")
      })
    }
  }, [sendResult])

  async function sendPrescription(): Promise<void> {
    setLoadingMessage("Sending prescription.")

    const request = {signatureToken: token}
    const response = await axios.post<SendResult>(`${baseUrl}prescribe/send`, request)
    console.log(request)
    console.log(response)

    setSendResult(response.data)
    setLoadingMessage(undefined)
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
  prescription_ids: string[]
  prescription_id: string
  success: boolean
  request: fhir.Bundle
  request_xml: string
  response: fhir.OperationOutcome
  response_xml: string
}

export default SendPage

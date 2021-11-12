import * as React from "react"
import {ActionLink, Button, CrossIcon, Label, SummaryList, TickIcon} from "nhsuk-react-components"
import axios from "axios"
import * as fhir from "fhir/r4"
import MessageExpanders from "../components/messageExpanders"
import ButtonList from "../components/buttonList"
import LongRunningTask from "../components/longRunningTask"
import {useContext} from "react"
import {AppContext} from "../index"

interface SendPageProps {
  token: string
}

const SendPage: React.FC<SendPageProps> = ({
  token
}) => {
  const {baseUrl} = useContext(AppContext)
  return (
    <LongRunningTask<SendResult> task={() => sendPrescription(baseUrl, token)} message="Sending prescription.">
      {sendResult => (
        <>
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
      )}
    </LongRunningTask>
  )
}

async function sendPrescription(baseUrl: string, token: string): Promise<SendResult> {
  const request = {signatureToken: token}
  const response = await axios.post<SendResult>(`${baseUrl}prescribe/send`, request)
  return response.data
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

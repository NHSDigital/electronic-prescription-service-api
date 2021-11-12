import * as React from "react"
import {useContext} from "react"
import {Button, CrossIcon, Label, SummaryList, TickIcon} from "nhsuk-react-components"
import axios from "axios"
import * as fhir from "fhir/r4"
import MessageExpanders from "../components/messageExpanders"
import ButtonList from "../components/buttonList"
import LongRunningTask from "../components/longRunningTask"
import {AppContext} from "../index"
import PrescriptionActions from "../components/prescriptionActions"

interface SendPageProps {
  token: string
}

const SendPage: React.FC<SendPageProps> = ({
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

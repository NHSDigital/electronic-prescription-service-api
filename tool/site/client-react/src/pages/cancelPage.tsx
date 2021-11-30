import * as React from "react"
import {useContext, useState} from "react"
import {Label, TickIcon, CrossIcon} from "nhsuk-react-components"
import {AppContext} from "../index"
import ButtonList from "../components/buttonList"
import LongRunningTask from "../components/longRunningTask"
import * as fhir from "fhir/r4"
import PrescriptionActions from "../components/prescriptionActions"
import MessageExpanders from "../components/messageExpanders"
import ReloadButton from "../components/reloadButton"
import axios from "axios"
import CancelForm, {CancelFormValues, MedicationRadio} from "../components/cancel/cancelForm"
import {getMedicationRequestResources} from "../fhir/bundleResourceFinder"

interface CancelPageProps {
  prescriptionId?: string
}

const CancelPage: React.FC<CancelPageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)
  const [cancelFormValues, setCancelFormValues] = useState<CancelFormValues>()
  const retrievePrescriptionTask = () => retrievePrescriptionDetails(baseUrl, prescriptionId)

  return (
    <LongRunningTask<PrescriptionDetails> task={retrievePrescriptionTask} loadingMessage="Retrieving prescription details.">
      {prescriptionDetails => {
        if (!cancelFormValues) {
          const medications = createStaticMedicationArray(
            prescriptionDetails.medicationRequests
          )
          return (
            <>
              <Label isPageHeading>Cancel Prescription</Label>
              <CancelForm medications={medications} onSubmit={setCancelFormValues}/>
            </>
          )
        }

        const sendCancelTask = () => sendCancel(baseUrl, cancelFormValues)
        return (
          <LongRunningTask<CancelResult> task={sendCancelTask} loadingMessage="Sending cancellation.">
            {dispenseResult => (
              <>
                <Label isPageHeading>Cancel Result {dispenseResult.success ? <TickIcon/> : <CrossIcon/>}</Label>
                <PrescriptionActions prescriptionId={prescriptionId} view/>
                <MessageExpanders
                  fhirRequest={dispenseResult.request}
                  hl7V3Request={dispenseResult.request_xml}
                  fhirResponse={dispenseResult.response}
                  hl7V3Response={dispenseResult.response_xml}
                />
                <ButtonList>
                  <ReloadButton/>
                </ButtonList>
              </>
            )}
          </LongRunningTask>
        )
      }}
    </LongRunningTask>
  )
}

async function retrievePrescriptionDetails(baseUrl: string, prescriptionId: string): Promise<PrescriptionDetails> {
  const releasedPrescription = await axios.get<fhir.Bundle>(`${baseUrl}prescription/${prescriptionId}`)
  const prescriptionOrder = releasedPrescription.data
  if (!prescriptionOrder) {
    throw new Error("Prescription order not found. Is the ID correct?")
  }

  return {
    medicationRequests: getMedicationRequestResources(prescriptionOrder)
  }
}

function createStaticMedicationArray(
  medicationRequests: Array<fhir.MedicationRequest>
): Array<MedicationRadio> {
  return medicationRequests.map(medicationRequest => {
    const medicationCodeableConceptCoding = medicationRequest.medicationCodeableConcept.coding[0]
    return {
      value: medicationCodeableConceptCoding.code,
      text: medicationCodeableConceptCoding.display
    }
  })
}

function createCancel(cancelFormValues: CancelFormValues): fhir.Bundle {
  console.log(JSON.stringify(cancelFormValues))
  return {} as fhir.Bundle
}

async function sendCancel(
  baseUrl: string,
  cancelFormValues: CancelFormValues
): Promise<CancelResult> {
  const cancel = createCancel(cancelFormValues)

  const response = await axios.post<CancelResult>(`${baseUrl}prescribe/cancel`, cancel)
  console.log(cancel)
  console.log(response)

  return response.data
}

export default CancelPage

interface PrescriptionDetails {
  medicationRequests: Array<fhir.MedicationRequest>
}

interface CancelResult {
  success: boolean
  request: fhir.Bundle
  request_xml: string
  response: fhir.OperationOutcome
  response_xml: string
}

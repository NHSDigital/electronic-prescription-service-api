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
import CancelForm, {CancelFormValues, cancellationReasons, MedicationRadio} from "../components/cancel/cancelForm"
import {getMedicationRequestResources, getMessageHeaderResources} from "../fhir/bundleResourceFinder"
import {createUuidIdentifier} from "../fhir/helpers"

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

        const sendCancelTask = () => sendCancel(baseUrl, prescriptionDetails, cancelFormValues)
        return (
          <LongRunningTask<CancelResult> task={sendCancelTask} loadingMessage="Sending cancellation.">
            {cancelResult => (
              <>
                <Label isPageHeading>Cancel Result {cancelResult.success ? <TickIcon/> : <CrossIcon/>}</Label>
                <PrescriptionActions prescriptionId={prescriptionId} view/>
                <MessageExpanders
                  fhirRequest={cancelResult.request}
                  hl7V3Request={cancelResult.request_xml}
                  fhirResponse={cancelResult.response}
                  hl7V3Response={cancelResult.response_xml}
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
    bundle: prescriptionOrder,
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

async function sendCancel(
  baseUrl: string,
  prescriptionDetails: PrescriptionDetails,
  cancelFormValues: CancelFormValues
): Promise<CancelResult> {
  const cancel = createCancel(prescriptionDetails, cancelFormValues)

  const response = await axios.post<CancelResult>(`${baseUrl}prescribe/cancel`, cancel)
  console.log(cancel)
  console.log(response)

  return response.data
}

function createCancel(prescriptionDetails: PrescriptionDetails, cancelFormValues: CancelFormValues): fhir.Bundle {
  const cancelRequest = prescriptionDetails.bundle
  cancelRequest.identifier = createUuidIdentifier()
  const messageHeader = getMessageHeaderResources(cancelRequest)[0]
  messageHeader.eventCoding.code = "prescription-order-update"
  messageHeader.eventCoding.display = "Prescription Order Update"
  messageHeader.focus = []
  const medicationToCancelSnomed = cancelFormValues.cancellationMedication
  const medicationRequests = getMedicationRequestResources(prescriptionDetails.bundle)
  const medicationToCancel = medicationRequests.filter(medicationRequest =>
    medicationRequest.medicationCodeableConcept.coding.some(
      c => c.code === medicationToCancelSnomed
    )
  )[0]
  medicationToCancel.status = "cancelled"
  const cancellationReason = cancelFormValues.cancellationReason
  medicationToCancel.statusReason = {
    coding: [
      {
        system:
          "https://fhir.nhs.uk/CodeSystem/medicationrequest-status-reason",
        code: cancellationReason,
        display: cancellationReasons.find(r => r.value === cancellationReason).value
      }
    ]
  }
  cancelRequest.entry =
    cancelRequest
      .entry
      .filter(entry =>
        singleMedicationResourceToCancel(entry, medicationToCancelSnomed)
        || nonMedicationResources(entry)
      )
  return cancelRequest
}

interface PrescriptionDetails {
  bundle: fhir.Bundle
  medicationRequests: Array<fhir.MedicationRequest>
}

interface CancelResult {
  success: boolean
  request: fhir.Bundle
  request_xml: string
  response: fhir.OperationOutcome
  response_xml: string
}

function singleMedicationResourceToCancel(e: fhir.BundleEntry, medicationToCancelSnomed: string): unknown {
  return (e.resource.resourceType === "MedicationRequest"
    && (e.resource as fhir.MedicationRequest)
      .medicationCodeableConcept.coding.some(c => c.code === medicationToCancelSnomed))
}

function nonMedicationResources(e: fhir.BundleEntry): unknown {
  return e.resource.resourceType !== "MedicationRequest"
}

export default CancelPage

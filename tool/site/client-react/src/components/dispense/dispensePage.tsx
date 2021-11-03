import * as React from "react"
import {useEffect, useState} from "react"
import {ErrorMessage, Label} from "nhsuk-react-components"
import axios from "axios"
import {
  getMedicationDispenseResources,
  getMedicationRequestResources,
  getMessageHeaderResources,
  getPatientResources
} from "../../fhir/bundleResourceFinder"
import * as fhir from "fhir/r4"
import {MedicationDispense} from "fhir/r4"
import Pre from "../pre"
import DispenseForm, {DispenseFormValues, StaticLineItemInfo, StaticPrescriptionInfo} from "./dispenseForm"
import {getMedicationDispenseLineItemId, getMedicationRequestLineItemId} from "../claim/createDispenseClaim"
import {formatQuantity} from "../../formatters/quantity"
import {createDispenseNotification} from "./createDispenseNotification"
import {getTaskBusinessStatusExtension} from "../../fhir/customExtensions"
import {LineItemStatus, PrescriptionStatus} from "./reference-data/valueSets"

interface DispensePageProps {
  baseUrl: string
  prescriptionId: string
}

const DispensePage: React.FC<DispensePageProps> = ({
  baseUrl,
  prescriptionId
}) => {
  const [loadingMessage, setLoadingMessage] = useState<string>("Loading page.")
  const [errorMessage, setErrorMessage] = useState<string>()
  const [prescriptionDetails, setPrescriptionDetails] = useState<PrescriptionDetails>()
  const [dispenseResult, setDispenseResult] = useState<string>()

  useEffect(() => {
    if (!prescriptionDetails) {
      retrievePrescriptionDetails().catch(error => {
        console.log(error)
        setErrorMessage("Failed to retrieve prescription details.")
      })
    }
  }, [prescriptionDetails])

  async function retrievePrescriptionDetails() {
    setLoadingMessage("Retrieving prescription details.")

    const prescriptionOrderResponse = await axios.get<fhir.Bundle>(`${baseUrl}prescription/${prescriptionId}`)
    const prescriptionOrder = prescriptionOrderResponse.data
    if (!prescriptionOrder) {
      setErrorMessage("Prescription order not found. Is the ID correct?")
      return
    }

    const dispenseNotificationsResponse = await axios.get<Array<fhir.Bundle>>(`${baseUrl}dispenseNotifications/${prescriptionId}`)
    const dispenseNotifications = dispenseNotificationsResponse.data

    setPrescriptionDetails({
      messageHeader: getMessageHeaderResources(prescriptionOrder)[0],
      patient: getPatientResources(prescriptionOrder)[0],
      medicationRequests: getMedicationRequestResources(prescriptionOrder),
      medicationDispenses: dispenseNotifications.flatMap(getMedicationDispenseResources)
    })
    setLoadingMessage(undefined)
  }

  async function sendDispenseNotification(dispenseFormValues: DispenseFormValues): Promise<void> {
    setLoadingMessage("Sending dispense notification.")

    const dispenseNotification = createDispenseNotification(
      prescriptionDetails.messageHeader,
      prescriptionDetails.patient,
      prescriptionDetails.medicationRequests,
      dispenseFormValues
    )

    const response = await axios.post(`${baseUrl}dispense/dispense`, dispenseNotification)
    console.log(dispenseNotification)
    console.log(response)

    setDispenseResult(JSON.stringify(response.data, null, 2))
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

  if (dispenseResult) {
    return <>
      <Label isPageHeading>Result</Label>
      <Pre>{dispenseResult}</Pre>
    </>
  }

  if (prescriptionDetails) {
    return <>
      <Label isPageHeading>Dispense Medication</Label>
      <DispenseForm
        lineItems={createStaticLineItemInfoArray(prescriptionDetails.medicationRequests, prescriptionDetails.medicationDispenses)}
        prescription={createStaticPrescriptionInfo(prescriptionDetails.medicationDispenses)}
        sendDispenseNotification={sendDispenseNotification}
      />
    </>
  }

  return <>
    <Label isPageHeading>Error</Label>
    <ErrorMessage>An unknown error occurred.</ErrorMessage>
  </>
}

interface PrescriptionDetails {
  messageHeader: fhir.MessageHeader
  patient: fhir.Patient
  medicationRequests: Array<fhir.MedicationRequest>
  medicationDispenses: Array<fhir.MedicationDispense>
}

function createStaticLineItemInfoArray(
  medicationRequests: Array<fhir.MedicationRequest>,
  medicationDispenses: Array<fhir.MedicationDispense>
): Array<StaticLineItemInfo> {
  return medicationRequests.map(medicationRequest => {
    const lineItemId = getMedicationRequestLineItemId(medicationRequest)
    const medicationDispensesForItem = medicationDispenses.filter(medicationDispense =>
      getMedicationDispenseLineItemId(medicationDispense) === lineItemId
    )
    const latestMedicationDispenseForItem = medicationDispensesForItem.pop()
    return createStaticLineItemInfo(medicationRequest, latestMedicationDispenseForItem)
  })
}

export function createStaticLineItemInfo(
  medicationRequest: fhir.MedicationRequest,
  medicationDispense?: fhir.MedicationDispense
): StaticLineItemInfo {
  //TODO - use release response not process-message request
  return {
    id: getMedicationRequestLineItemId(medicationRequest),
    name: medicationRequest.medicationCodeableConcept.coding[0].display,
    quantity: formatQuantity(medicationRequest.dispenseRequest.quantity),
    priorStatusCode: medicationDispense
      ? getLineItemStatus(medicationDispense)
      : LineItemStatus.TO_BE_DISPENSED,
    priorNonDispensingReasonCode: medicationDispense?.statusReasonCodeableConcept?.coding?.[0]?.code
  }
}

export function createStaticPrescriptionInfo(medicationDispenses: Array<MedicationDispense>): StaticPrescriptionInfo {
  //TODO - use release response
  return {
    priorStatusCode: medicationDispenses.length
      ? getPrescriptionStatus(medicationDispenses[medicationDispenses.length - 1])
      : PrescriptionStatus.TO_BE_DISPENSED
  }
}

function getLineItemStatus(medicationDispense: MedicationDispense): LineItemStatus {
  return medicationDispense.type.coding[0].code as LineItemStatus
}

function getPrescriptionStatus(medicationDispense: MedicationDispense): PrescriptionStatus {
  return getTaskBusinessStatusExtension(medicationDispense.extension).valueCoding.code as PrescriptionStatus
}

export default DispensePage

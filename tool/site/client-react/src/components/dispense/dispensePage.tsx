import * as React from "react"
import {useEffect, useState} from "react"
import {ErrorMessage, Label} from "nhsuk-react-components"
import axios from "axios"
import {
  getMedicationDispenseResources,
  getMedicationRequestResources,
  getPatientResources
} from "../../fhir/bundleResourceFinder"
import * as fhir from "fhir/r4"
import Pre from "../pre"
import DispenseForm, {DispenseFormValues, StaticLineItemInfo} from "./dispenseForm"
import {getMedicationDispenseLineItemId, getMedicationRequestLineItemId} from "../claim/createDispenseClaim"
import {formatQuantity} from "../../formatters/quantity"
import {getTaskBusinessStatusExtension} from "../../fhir/customExtensions"

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

    const historyResponse = await axios.get<HistoryResponse>(`${baseUrl}dispense/history?prescription_id=${prescriptionId}`)
    const dispenseNotifications = historyResponse.data?.dispense_notifications ?? []

    setPrescriptionDetails({
      patient: getPatientResources(prescriptionOrder)[0],
      medicationRequests: getMedicationRequestResources(prescriptionOrder),
      medicationDispenses: dispenseNotifications.flatMap(getMedicationDispenseResources)
    })
    setLoadingMessage(undefined)
  }

  async function sendDispenseNotification(dispenseFormValues: DispenseFormValues): Promise<void> {
    setLoadingMessage("Sending dispense notification.")

    //TODO - send to server

    setDispenseResult(JSON.stringify(dispenseFormValues))
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
        lineItems={createStaticLineItemInfoArray(prescriptionDetails)}
        sendDispenseNotification={sendDispenseNotification}
      />
    </>
  }

  return <>
    <Label isPageHeading>Error</Label>
    <ErrorMessage>An unknown error occurred.</ErrorMessage>
  </>
}

interface HistoryResponse {
  dispense_notifications: Array<fhir.Bundle>
}

interface PrescriptionDetails {
  patient: fhir.Patient
  medicationRequests: Array<fhir.MedicationRequest>
  medicationDispenses: Array<fhir.MedicationDispense>
}

function createStaticLineItemInfoArray(prescriptionDetails: PrescriptionDetails): Array<StaticLineItemInfo> {
  return prescriptionDetails.medicationRequests.map(medicationRequest => {
    const lineItemId = getMedicationRequestLineItemId(medicationRequest)
    const medicationDispensesForItem = prescriptionDetails.medicationDispenses.filter(medicationDispense =>
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
      ? medicationDispense.type.coding[0].code
      : "0007"
  }
}

export default DispensePage

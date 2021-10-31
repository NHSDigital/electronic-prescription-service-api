import * as React from "react"
import {useEffect, useState} from "react"
import {ErrorMessage, Label} from "nhsuk-react-components"
import Claim, {ClaimFormValues, StaticProductInfo} from "./claim"
import axios from "axios"
import {
  getMedicationDispenseResources,
  getMedicationRequestResources,
  getPatientResources
} from "../../fhir/bundleResourceFinder"
import * as fhir from "fhir/r4"
import Pre from "../pre"
import {createClaim, getMedicationDispenseLineItemId} from "./createDispenseClaim"
import {getTaskBusinessStatusExtension} from "../../fhir/customExtensions"

interface ClaimPageProps {
  baseUrl: string
  prescriptionId: string
}

const ClaimPage: React.FC<ClaimPageProps> = ({
  baseUrl,
  prescriptionId
}) => {
  const [loadingMessage, setLoadingMessage] = useState<string>("Loading page.")
  const [errorMessage, setErrorMessage] = useState<string>()
  const [prescriptionDetails, setPrescriptionDetails] = useState<PrescriptionDetails>()
  const [claimResult, setClaimResult] = useState<string>()

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
    const dispenseNotifications = historyResponse.data?.dispense_notifications
    if (!dispenseNotifications?.length) {
      setErrorMessage("Dispense notification not found. Has this prescription been dispensed?")
      return
    }

    setPrescriptionDetails({
      patient: getPatientResources(prescriptionOrder)[0],
      medicationRequests: getMedicationRequestResources(prescriptionOrder),
      medicationDispenses: dispenseNotifications.flatMap(getMedicationDispenseResources)
    })
    setLoadingMessage(undefined)
  }

  async function sendClaim(claimFormValues: ClaimFormValues): Promise<void> {
    setLoadingMessage("Sending claim.")

    const claim = createClaim(
      prescriptionDetails.patient,
      prescriptionDetails.medicationRequests,
      prescriptionDetails.medicationDispenses,
      claimFormValues
    )
    const response = await axios.post(`${baseUrl}dispense/claim`, claim)
    const responseStr = JSON.stringify(response.data)

    setClaimResult(responseStr)
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

  if (claimResult) {
    return <>
      <Label isPageHeading>Result</Label>
      <Pre>{claimResult}</Pre>
    </>
  }

  if (prescriptionDetails) {
    return <>
      <Label isPageHeading>Claim for Dispensed Medication</Label>
      <Claim
        products={prescriptionDetails.medicationDispenses.map(toStaticProductInfo)}
        sendClaim={sendClaim}
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

function toStaticProductInfo(medicationDispense: fhir.MedicationDispense): StaticProductInfo {
  return {
    id: getMedicationDispenseLineItemId(medicationDispense),
    name: medicationDispense.medicationCodeableConcept.coding[0].display,
    quantityDispensed: `${medicationDispense.quantity.value} ${medicationDispense.quantity.unit}`,
    status: getTaskBusinessStatusExtension(medicationDispense.extension).valueCoding.display
  }
}

export default ClaimPage

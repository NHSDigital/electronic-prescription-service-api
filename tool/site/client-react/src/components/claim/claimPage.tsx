import * as React from "react"
import {useEffect, useState} from "react"
import {ErrorMessage, Label} from "nhsuk-react-components"
import Claim, {ClaimProps} from "./claim"
import axios from "axios"
import {
  getMedicationDispenseResources,
  getMedicationRequestResources,
  getPatientResources
} from "../../fhir/bundleResourceFinder"
import * as fhir from "fhir/r4"
import Pre from "../pre"

interface ClaimPageProps {
  baseUrl: string
  prescriptionId: string
}

const ClaimPage: React.FC<ClaimPageProps> = ({
  baseUrl,
  prescriptionId
}) => {
  const [loadingMessage, setLoadingMessage] = useState<string>()
  const [errorMessage, setErrorMessage] = useState<string>()
  const [claimProps, setClaimProps] = useState<ClaimProps>()
  const [claimResult, setClaimResult] = useState<string>()

  useEffect(() => {
    if (!claimProps) {
      retrievePrescriptionDetails().catch(error => {
        console.log(error)
        setErrorMessage("Failed to retrieve prescription details.")
      })
    }
  }, [claimProps])

  async function retrievePrescriptionDetails() {
    setLoadingMessage("Retrieving dispense history.")

    const prescriptionOrderResponse = await axios.get<fhir.Bundle>(`${baseUrl}prescription/${prescriptionId}`)
    const prescriptionOrder = prescriptionOrderResponse.data
    if (!prescriptionOrder) {
      setErrorMessage("Prescription not found. Is the ID correct?")
      return
    }

    const historyResponse = await axios.get<HistoryResponse>(`${baseUrl}dispense/history?prescription_id=${prescriptionId}`)
    const dispenseNotifications = historyResponse.data?.dispense_notifications
    if (!dispenseNotifications?.length) {
      setErrorMessage("Dispense history not found. Has this prescription been dispensed?")
      return
    }

    setClaimProps({
      patient: getPatientResources(prescriptionOrder)[0],
      medicationRequests: getMedicationRequestResources(prescriptionOrder),
      medicationDispenses: dispenseNotifications.flatMap(getMedicationDispenseResources),
      sendClaim
    })
    setLoadingMessage(undefined)
  }

  async function sendClaim(claim: fhir.Claim): Promise<void> {
    setLoadingMessage("Sending claim.")

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

  if (claimProps) {
    return <Claim {...claimProps}/>
  }

  return <>
    <Label isPageHeading>Error</Label>
    <ErrorMessage>An unknown error occurred.</ErrorMessage>
  </>
}

interface HistoryResponse {
  dispense_notifications: Array<fhir.Bundle>
}

export default ClaimPage

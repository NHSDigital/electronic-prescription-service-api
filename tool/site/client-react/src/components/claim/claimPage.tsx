import * as React from "react"
import {useEffect, useState} from "react"
import {Button, CrossIcon, ErrorMessage, Label, TickIcon} from "nhsuk-react-components"
import ClaimForm, {ClaimFormValues, StaticProductInfo} from "./claimForm"
import axios from "axios"
import {
  getMedicationDispenseResources,
  getMedicationRequestResources,
  getPatientResources
} from "../../fhir/bundleResourceFinder"
import * as fhir from "fhir/r4"
import {MedicationDispense} from "fhir/r4"
import {createClaim} from "./createDispenseClaim"
import MessageExpanders from "../messageExpanders"
import ButtonList from "../buttonList"
import {getMedicationDispenseLineItemId, getTotalQuantity} from "../../fhir/helpers"
import {formatQuantity} from "../../formatters/quantity"

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
  const [claimResult, setClaimResult] = useState<ClaimResult>()

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
    const response = await axios.post<ClaimResult>(`${baseUrl}dispense/claim`, claim)
    console.log(claim)
    console.log(response)

    setClaimResult(response.data)
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
      <Label isPageHeading>Claim Result {claimResult.success ? <TickIcon/> : <CrossIcon/>}</Label>
      <MessageExpanders
        fhirRequest={claimResult.request}
        hl7V3Request={claimResult.request_xml}
        fhirResponse={claimResult.response}
        hl7V3Response={claimResult.response_xml}
      />
      <ButtonList>
        <Button type="button" href={baseUrl} secondary>Back</Button>
      </ButtonList>
    </>
  }

  if (prescriptionDetails) {
    return <>
      <Label isPageHeading>Claim for Dispensed Medication</Label>
      <ClaimForm
        products={createStaticProductInfoArray(prescriptionDetails.medicationDispenses)}
        sendClaim={sendClaim}
      />
    </>
  }

  return <>
    <Label isPageHeading>Error</Label>
    <ErrorMessage>An unknown error occurred.</ErrorMessage>
  </>
}

interface PrescriptionDetails {
  patient: fhir.Patient
  medicationRequests: Array<fhir.MedicationRequest>
  medicationDispenses: Array<fhir.MedicationDispense>
}

interface ClaimResult {
  success: boolean
  request: fhir.Claim
  request_xml: string
  response: fhir.OperationOutcome
  response_xml: string
}

function createStaticProductInfoArray(medicationDispenses: Array<MedicationDispense>): Array<StaticProductInfo> {
  const lineItemGroups = groupByProperty(medicationDispenses, getMedicationDispenseLineItemId)
  return lineItemGroups.map(([lineItemId, medicationDispensesForLineItem]) => {
    const latestMedicationDispense = medicationDispensesForLineItem[medicationDispensesForLineItem.length - 1]
    const totalQuantity = getTotalQuantity(medicationDispensesForLineItem.map(m => m.quantity))
    return {
      id: lineItemId,
      name: latestMedicationDispense.medicationCodeableConcept.coding[0].display,
      quantityDispensed: formatQuantity(totalQuantity),
      status: latestMedicationDispense.type.coding[0].display
    }
  })
}

// TODO - maybe handle dispensing multiple products to fulfill a request
// function createStaticProductInfoArray(
//   medicationRequests: Array<MedicationRequest>,
//   medicationDispenses: Array<MedicationDispense>
// ): Array<StaticProductInfo> {
//   const lineItemGroups = groupByProperty(medicationDispenses, getMedicationDispenseLineItemId)
//   return lineItemGroups.flatMap((([, medicationDispensesForLineItem]) =>
//     createStaticProductInfoArrayForLineItem(medicationDispensesForLineItem)
//   ))
// }
//
// function createStaticProductInfoArrayForLineItem(
//   medicationDispenses: Array<MedicationDispense>
// ): Array<StaticProductInfo> {
//   const latestMedicationDispense = medicationDispenses[medicationDispenses.length - 1]
//   const lineItemId = getMedicationDispenseLineItemId(latestMedicationDispense)
//   const finalStatus = latestMedicationDispense.type.coding[0].display
//
//   const productGroups = groupByProperty(
//     medicationDispenses,
//     medicationDispense => medicationDispense.medicationCodeableConcept.coding[0].code
//   )
//   return productGroups.map(([, medicationDispensesForProduct]) => {
//     const totalQuantity = medicationDispensesForProduct
//       .map(medicationDispense => medicationDispense.quantity.value)
//       .reduce((a, b) => a + b)
//     return {
//       id: lineItemId,
//       name: medicationDispensesForProduct[0].medicationCodeableConcept.coding[0].display,
//       quantityDispensed: `${totalQuantity} ${medicationDispensesForProduct[0].quantity.unit}`,
//       status: finalStatus
//     }
//   })
// }

function groupByProperty<K, V>(array: Array<V>, getProperty: (value: V) => K): Array<[K, Array<V>]> {
  const uniquePropertyValues = new Set(array.map(getProperty))
  return Array.from(uniquePropertyValues).map(propertyValue => [
    propertyValue,
    array.filter(element => getProperty(element) === propertyValue)
  ])
}

export default ClaimPage

import * as React from "react"
import {useContext, useState} from "react"
import {CrossIcon, Label, TickIcon} from "nhsuk-react-components"
import ClaimForm, {ClaimFormValues, StaticProductInfo} from "../components/claim/claimForm"
import axios from "axios"
import {
  getMedicationDispenseResources,
  getMedicationRequestResources,
  getPatientResources
} from "../fhir/bundleResourceFinder"
import * as fhir from "fhir/r4"
import {MedicationDispense} from "fhir/r4"
import {createClaim} from "../components/claim/createDispenseClaim"
import MessageExpanders from "../components/messageExpanders"
import ButtonList from "../components/buttonList"
import {getMedicationDispenseLineItemId, getTotalQuantity} from "../fhir/helpers"
import {formatQuantity} from "../formatters/quantity"
import LongRunningTask from "../components/longRunningTask"
import {AppContext} from "../index"
import PrescriptionActions from "../components/prescriptionActions"
import ReloadButton from "../components/reloadButton"

interface ClaimPageProps {
  prescriptionId: string
}

const ClaimPage: React.FC<ClaimPageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)
  const [claimFormValues, setClaimFormValues] = useState<ClaimFormValues>()

  const retrievePrescriptionTask = () => retrievePrescriptionDetails(baseUrl, prescriptionId)
  return (
    <LongRunningTask<PrescriptionDetails> task={retrievePrescriptionTask} loadingMessage="Retrieving prescription details.">
      {prescriptionDetails => {
        if (!claimFormValues) {
          const products = createStaticProductInfoArray(prescriptionDetails.medicationDispenses)
          return (
            <>
              <Label isPageHeading>Claim for Dispensed Medication</Label>
              <ClaimForm products={products} onSubmit={setClaimFormValues}/>
            </>
          )
        }

        const sendClaimTask = () => sendClaim(baseUrl, prescriptionDetails, claimFormValues)
        return (
          <LongRunningTask<ClaimResult> task={sendClaimTask} loadingMessage="Sending claim.">
            {claimResult => (
              <>
                <Label isPageHeading>Claim Result {claimResult.success ? <TickIcon/> : <CrossIcon/>}</Label>
                <PrescriptionActions prescriptionId={prescriptionId} view/>
                <MessageExpanders
                  fhirRequest={claimResult.request}
                  hl7V3Request={claimResult.request_xml}
                  fhirResponse={claimResult.response}
                  hl7V3Response={claimResult.response_xml}
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
  // todo: retrieve release response prescription instead of send prescription response here
  const prescriptionOrderResponse = await axios.get<fhir.Bundle>(`${baseUrl}prescription/${prescriptionId}`)
  const prescriptionOrder = prescriptionOrderResponse.data
  if (!prescriptionOrder) {
    throw new Error("Prescription order not found. Is the ID correct?")
  }

  const dispenseNotificationsResponse = await axios.get<Array<fhir.Bundle>>(`${baseUrl}dispenseNotifications/${prescriptionId}`)
  const dispenseNotifications = dispenseNotificationsResponse.data
  if (!dispenseNotifications?.length) {
    throw new Error("Dispense notification not found. Has this prescription been dispensed?")
  }

  return {
    patient: getPatientResources(prescriptionOrder)[0],
    medicationRequests: getMedicationRequestResources(prescriptionOrder),
    medicationDispenses: dispenseNotifications.flatMap(getMedicationDispenseResources)
  }
}

async function sendClaim(
  baseUrl: string,
  prescriptionDetails: PrescriptionDetails,
  claimFormValues: ClaimFormValues
): Promise<ClaimResult> {
  const claim = createClaim(
    prescriptionDetails.patient,
    prescriptionDetails.medicationRequests,
    prescriptionDetails.medicationDispenses,
    claimFormValues
  )
  const response = await axios.post<ClaimResult>(`${baseUrl}dispense/claim`, claim)
  return response.data
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

export function createStaticProductInfoArray(medicationDispenses: Array<MedicationDispense>): Array<StaticProductInfo> {
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

function groupByProperty<K, V>(array: Array<V>, getProperty: (value: V) => K): Array<[K, Array<V>]> {
  const uniquePropertyValues = new Set(array.map(getProperty))
  return Array.from(uniquePropertyValues).map(propertyValue => [
    propertyValue,
    array.filter(element => getProperty(element) === propertyValue)
  ])
}

export default ClaimPage

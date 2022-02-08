import * as React from "react"
import {useContext, useState} from "react"
import {CrossIcon, Label, TickIcon} from "nhsuk-react-components"
import ClaimForm, {ClaimFormValues, StaticProductInfo} from "../components/claim/claimForm"
import {
  getMedicationDispenseResources,
  getMedicationRequestResources,
  getPatientResources
} from "../fhir/bundleResourceFinder"
import * as fhir from "fhir/r4"
import {createClaim} from "../components/claim/createDispenseClaim"
import MessageExpanders from "../components/messageExpanders"
import ButtonList from "../components/buttonList"
import {getMedicationDispenseLineItemId, getTotalQuantity, MedicationDispense, MedicationRequest} from "../fhir/helpers"
import {formatQuantity} from "../formatters/quantity"
import LongRunningTask from "../components/longRunningTask"
import {AppContext} from "../index"
import PrescriptionActions from "../components/prescriptionActions"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {getArrayTypeGuard, isBundle} from "../fhir/typeGuards"
import {axiosInstance} from "../requests/axiosInstance"
import {isApiResult, ApiResult} from "../requests/apiResult"
import ReloadButton from "../components/reloadButton"
import {LineItemStatus} from "../fhir/reference-data/valueSets"

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
              <Label isPageHeading>Claim for Dispensed Prescription</Label>
              <ClaimForm products={products} onSubmit={setClaimFormValues}/>
            </>
          )
        }

        const sendClaimTask = () => sendClaim(baseUrl, prescriptionId, prescriptionDetails, claimFormValues)
        return (
          <LongRunningTask<ApiResult> task={sendClaimTask} loadingMessage="Sending claim.">
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
  const prescriptionOrderResponse = await axiosInstance.get<fhir.Bundle>(`${baseUrl}dispense/release/${prescriptionId}`)
  const prescriptionOrder = getResponseDataIfValid(prescriptionOrderResponse, isBundle)

  const dispenseNotificationsResponse = await axiosInstance.get<Array<fhir.Bundle>>(`${baseUrl}dispenseNotifications/${prescriptionId}`)
  const dispenseNotifications = getResponseDataIfValid(dispenseNotificationsResponse, getArrayTypeGuard(isBundle))

  if (!dispenseNotifications.length) {
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
  prescriptionId: string, 
  prescriptionDetails: PrescriptionDetails,
  claimFormValues: ClaimFormValues
): Promise<ApiResult> {
  const claim = createClaim(
    prescriptionDetails.patient,
    prescriptionDetails.medicationRequests,
    prescriptionDetails.medicationDispenses,
    claimFormValues
  )
  const response = await axiosInstance.post<ApiResult>(`${baseUrl}dispense/claim`, {prescriptionId, claim})
  return getResponseDataIfValid(response, isApiResult)
}

interface PrescriptionDetails {
  patient: fhir.Patient
  medicationRequests: Array<MedicationRequest>
  medicationDispenses: Array<MedicationDispense>
}

export function createStaticProductInfoArray(medicationDispenses: Array<MedicationDispense>): Array<StaticProductInfo> {
  const lineItemGroups = groupByProperty(medicationDispenses, getMedicationDispenseLineItemId)
  return lineItemGroups
    .filter(([, medicationDispensesForLineItem]) => {
      const latestMedicationDispense = medicationDispensesForLineItem[medicationDispensesForLineItem.length - 1]
      const latestLineItemStatusCode = latestMedicationDispense.type.coding[0].code
      return latestLineItemStatusCode === LineItemStatus.DISPENSED
    })
    .map(([lineItemId, medicationDispensesForLineItem]) => {
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

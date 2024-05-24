import React, {useContext, useState} from "react"
import {Label} from "nhsuk-react-components"
import ClaimForm, {
  ClaimFormValues,
  EndorsementFormValues,
  ExemptionFormValues,
  ProductFormValues,
  StaticProductInfo
} from "../components/claim/claimForm"
import {
  getMedicationDispenseResources,
  getMedicationRequestResources,
  getOrganizationResources,
  getPatientResources
} from "../fhir/bundleResourceFinder"
import * as fhir from "fhir/r4"
import {createClaim} from "../components/claim/createDispenseClaim"
import MessageExpanders from "../components/messageExpanders"
import ButtonList from "../components/common/buttonList"
import {getMedicationDispenseLineItemId, getTotalQuantity, MedicationDispense, MedicationRequest} from "../fhir/helpers"
import {formatQuantity} from "../formatters/quantity"
import LongRunningTask from "../components/common/longRunningTask"
import {AppContext} from "../index"
import PrescriptionActions from "../components/common/prescriptionActions"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {getArrayTypeGuard, isBundle, isClaim} from "../fhir/typeGuards"
import {axiosInstance} from "../requests/axiosInstance"
import {ApiResult, isApiResult} from "../requests/apiResult"
import ReloadButton from "../components/common/reloadButton"
import {LineItemStatus, PRESCRIPTION_CHARGE_EXEMPTION_CODE_NONE} from "../fhir/reference-data/valueSets"
import {getClaimMedicationRequestReferenceExtension} from "../fhir/customExtensions"
import SuccessOrFail from "../components/common/successOrFail"

interface ClaimPageProps {
  prescriptionId: string
  amend?: boolean
}

const ClaimPage: React.FC<ClaimPageProps> = ({
  prescriptionId,
  amend
}) => {
  const {baseUrl} = useContext(AppContext)
  const [claimFormValues, setClaimFormValues] = useState<ClaimFormValues>()

  const retrievePrescriptionTask = () => retrievePrescriptionDetails(baseUrl, prescriptionId, amend)
  return (
    <LongRunningTask<PrescriptionDetails> task={retrievePrescriptionTask} loadingMessage="Retrieving prescription details.">
      {prescriptionDetails => {
        if (!claimFormValues) {
          const products = createStaticProductInfoArray(prescriptionDetails.medicationDispenses)
          const formInitialValues = getInitialValues(products, prescriptionDetails.previousClaim)

          return (
            <React.Fragment key="claimPage">
              <Label isPageHeading>Claim for Dispensed Prescription</Label>
              <ClaimForm initialValues={formInitialValues} onSubmit={setClaimFormValues}/>
            </React.Fragment>
          )
        }

        const sendClaimTask = () => sendClaim(baseUrl, prescriptionId, prescriptionDetails, claimFormValues)
        return (
          <LongRunningTask<ApiResult> task={sendClaimTask} loadingMessage="Sending claim.">
            {claimResult => (
              <>
                <Label isPageHeading>Claim Result {<SuccessOrFail condition={claimResult.success} />}</Label>
                <PrescriptionActions prescriptionId={prescriptionId} cancel claimAmend statusView/>
                <MessageExpanders
                  fhirRequest={claimResult.request}
                  hl7V3Request={claimResult.request_xml}
                  hl7V3Response={claimResult.response_xml}
                  fhirResponse={claimResult.response}
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

async function retrievePrescriptionDetails(baseUrl: string, prescriptionId: string, amend: boolean): Promise<PrescriptionDetails> {
  const prescriptionOrderResponse = await axiosInstance.get<fhir.Bundle>(`${baseUrl}dispense/release/${prescriptionId}`)
  const prescriptionOrder = getResponseDataIfValid(prescriptionOrderResponse, isBundle)

  const dispenseNotificationsResponse = await axiosInstance.get<Array<fhir.Bundle>>(`${baseUrl}dispenseNotifications/${prescriptionId}`)
  const dispenseNotifications = getResponseDataIfValid(dispenseNotificationsResponse, getArrayTypeGuard(isBundle))

  if (!dispenseNotifications.length) {
    throw new Error("Dispense notification not found. Has this prescription been dispensed?")
  }

  const prescriptionDetails: PrescriptionDetails = {
    patient: getPatientResources(prescriptionOrder)[0],
    medicationRequests: getMedicationRequestResources(prescriptionOrder),
    medicationDispenses: dispenseNotifications.flatMap(getMedicationDispenseResources),
    dispensingOrganization: dispenseNotifications.flatMap(getOrganizationResources)[0]
  }

  if (amend) {
    const claimResponse = await axiosInstance.get<fhir.Claim>(`${baseUrl}claim/${prescriptionId}`)
    prescriptionDetails.previousClaim = getResponseDataIfValid(claimResponse, isClaim)
  }

  return prescriptionDetails
}

export function getInitialValues(products: Array<StaticProductInfo>, previousClaim?: fhir.Claim): ClaimFormValues {
  if (previousClaim) {
    return {
      products: getProductInfo(products, previousClaim),
      exemption: getExemptionInfo(previousClaim)
    }
  } else {
    const defaultValues = {
      products: products.map(product => ({
        ...product,
        patientPaid: false,
        endorsements: []
      })),
      exemption: {
        code: PRESCRIPTION_CHARGE_EXEMPTION_CODE_NONE,
        evidenceSeen: false
      }
    }
    return defaultValues
  }
}

function getProductInfo(products: Array<StaticProductInfo>, previousClaim: fhir.Claim): Array<ProductFormValues> {
  const claimDetails = previousClaim.item.flatMap(item => item.detail)
  return claimDetails.map(detail => {
    const claimDetailIdentifierExtension = getClaimMedicationRequestReferenceExtension(detail.extension)
    const lineItemId = claimDetailIdentifierExtension.valueReference.identifier.value

    const associatedProduct = products.find(product => product.id === lineItemId)

    return {
      ...associatedProduct,
      patientPaid: getPatientPaid(detail),
      endorsements: getEndorsementInfo(detail)
    }
  })
}

function getPatientPaid(detail: fhir.ClaimItemDetail): boolean {
  const patientPaidCoding = detail.programCode
    .flatMap(codeableConcept => codeableConcept.coding)
    .find(coding => coding.system === "https://fhir.nhs.uk/CodeSystem/DM-prescription-charge")
  return patientPaidCoding.code === "paid-once"
}

function getEndorsementInfo(detail: fhir.ClaimItemDetail): Array<EndorsementFormValues> {
  const endorsementCodeableConcepts = detail.programCode
    .filter(codeableConcept => codeableConcept.coding
      .some(coding => coding.system === "https://fhir.nhs.uk/CodeSystem/medicationdispense-endorsement"))
  return endorsementCodeableConcepts.map(codeableConcept => ({
    code: codeableConcept.coding.find(coding => coding.system === "https://fhir.nhs.uk/CodeSystem/medicationdispense-endorsement").code,
    supportingInfo: codeableConcept?.text
  }))
}

function getExemptionInfo(previousClaim: fhir.Claim): ExemptionFormValues {
  const programCodeCodings = previousClaim.item
    .flatMap(item => item.programCode)
    .flatMap(codeableConcept => codeableConcept.coding)

  const exemptionCoding = programCodeCodings.find(coding => coding.system === "https://fhir.nhs.uk/CodeSystem/prescription-charge-exemption")
  const exemptionCode = exemptionCoding.code

  const evidenceSeenCoding = programCodeCodings.find(coding => coding.system === "https://fhir.nhs.uk/CodeSystem/DM-exemption-evidence")
  const evidenceSeenCode = evidenceSeenCoding.code

  return {
    code: exemptionCode,
    evidenceSeen: evidenceSeenCode === "evidence-seen"
  }
}

async function sendClaim(
  baseUrl: string,
  prescriptionId: string,
  prescriptionDetails: PrescriptionDetails,
  claimFormValues: ClaimFormValues
): Promise<ApiResult> {
  const claim = createClaim(
    prescriptionDetails,
    claimFormValues
  )
  const response = await axiosInstance.post<ApiResult>(`${baseUrl}dispense/claim`, {prescriptionId, claim})
  return getResponseDataIfValid(response, isApiResult)
}

export interface PrescriptionDetails {
  patient: fhir.Patient
  medicationRequests: Array<MedicationRequest>
  medicationDispenses: Array<MedicationDispense>
  dispensingOrganization: fhir.Organization
  previousClaim?: fhir.Claim
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

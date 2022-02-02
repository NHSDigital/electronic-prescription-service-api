import * as React from "react"
import {useContext, useState} from "react"
import {CrossIcon, Label, TickIcon} from "nhsuk-react-components"
import {
  getMedicationDispenseResources,
  getMedicationRequestResources,
  getMessageHeaderResources,
  getPatientResources
} from "../fhir/bundleResourceFinder"
import * as fhir from "fhir/r4"
import {MedicationDispense} from "fhir/r4"
import DispenseForm, {
  DispenseFormValues,
  StaticLineItemInfo,
  StaticPrescriptionInfo
} from "../components/dispense/dispenseForm"
import {formatQuantity} from "../formatters/quantity"
import {createDispenseNotification} from "../components/dispense/createDispenseNotification"
import {getTaskBusinessStatusExtension} from "../fhir/customExtensions"
import MessageExpanders from "../components/messageExpanders"
import ButtonList from "../components/buttonList"
import {LineItemStatus, PrescriptionStatus} from "../fhir/reference-data/valueSets"
import {getMedicationDispenseLineItemId, getMedicationRequestLineItemId} from "../fhir/helpers"
import LongRunningTask from "../components/longRunningTask"
import {AppContext} from "../index"
import PrescriptionActions from "../components/prescriptionActions"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {getArrayTypeGuard, isBundle} from "../fhir/typeGuards"
import {axiosInstance} from "../requests/axiosInstance"
import {isApiResult, ApiResult} from "../requests/apiResult"
import ReloadButton from "../components/reloadButton"

interface DispensePageProps {
  prescriptionId: string
}

const DispensePage: React.FC<DispensePageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)
  const [dispenseFormValues, setDispenseFormValues] = useState<DispenseFormValues>()

  const retrievePrescriptionTask = () => retrievePrescriptionDetails(baseUrl, prescriptionId)
  return (
    <LongRunningTask<PrescriptionDetails> task={retrievePrescriptionTask} loadingMessage="Retrieving prescription details.">
      {prescriptionDetails => {
        if (!dispenseFormValues) {
          const lineItems = createStaticLineItemInfoArray(
            prescriptionDetails.medicationRequests,
            prescriptionDetails.medicationDispenses
          )
          const prescription = createStaticPrescriptionInfo(prescriptionDetails.medicationDispenses)
          return (
            <>
              <Label isPageHeading>Dispense Medication</Label>
              <DispenseForm lineItems={lineItems} prescription={prescription} onSubmit={setDispenseFormValues}/>
            </>
          )
        }

        const sendDispenseNotificationTask = () => sendDispenseNotification(baseUrl, prescriptionDetails, dispenseFormValues)
        return (
          <LongRunningTask<ApiResult> task={sendDispenseNotificationTask} loadingMessage="Sending dispense notification.">
            {dispenseResult => (
              <>
                <Label isPageHeading>Dispense Result {dispenseResult.success ? <TickIcon/> : <CrossIcon/>}</Label>
                <PrescriptionActions prescriptionId={prescriptionId} claim withdraw view/>
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
  const prescriptionOrderResponse = await axiosInstance.get<fhir.Bundle>(`${baseUrl}dispense/release/${prescriptionId}`)
  const prescriptionOrder = getResponseDataIfValid(prescriptionOrderResponse, isBundle)

  const dispenseNotificationsResponse = await axiosInstance.get<Array<fhir.Bundle>>(`${baseUrl}dispenseNotifications/${prescriptionId}`)
  const dispenseNotifications = getResponseDataIfValid(dispenseNotificationsResponse, getArrayTypeGuard(isBundle))

  return {
    messageHeader: getMessageHeaderResources(prescriptionOrder)[0],
    patient: getPatientResources(prescriptionOrder)[0],
    medicationRequests: getMedicationRequestResources(prescriptionOrder),
    medicationDispenses: dispenseNotifications.flatMap(getMedicationDispenseResources)
  }
}

async function sendDispenseNotification(
  baseUrl: string,
  prescriptionDetails: PrescriptionDetails,
  dispenseFormValues: DispenseFormValues
): Promise<ApiResult> {
  const dispenseNotification = createDispenseNotification(
    prescriptionDetails.messageHeader,
    prescriptionDetails.patient,
    prescriptionDetails.medicationRequests,
    dispenseFormValues
  )

  const response = await axiosInstance.post<ApiResult>(`${baseUrl}dispense/dispense`, dispenseNotification)
  return getResponseDataIfValid(response, isApiResult)
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
    dispenseDate: new Date(),
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

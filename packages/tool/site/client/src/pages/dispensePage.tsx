import React, {useContext, useState} from "react"
import {Label} from "nhsuk-react-components"
import {
  getMedicationDispenseResources,
  getMedicationRequestResources,
  getMessageHeaderResources,
  getPatientResources
} from "../fhir/bundleResourceFinder"
import * as fhir from "fhir/r4"
import DispenseForm, {
  DispenseFormValues,
  StaticLineItemInfo,
  StaticPrescriptionInfo
} from "../components/dispense/dispenseForm"
import {createDispenseNotification} from "../components/dispense/createDispenseNotification"
import {getTaskBusinessStatusExtension} from "../fhir/customExtensions"
import MessageExpanders from "../components/messageExpanders"
import ButtonList from "../components/common/buttonList"
import {LineItemStatus, PrescriptionStatus} from "../fhir/reference-data/valueSets"
import {
  getMedicationDispenseLineItemId,
  getMedicationRequestLineItemId,
  MedicationDispense,
  MedicationRequest
} from "../fhir/helpers"
import LongRunningTask from "../components/common/longRunningTask"
import {AppContext} from "../index"
import PrescriptionActions from "../components/common/prescriptionActions"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {axiosInstance} from "../requests/axiosInstance"
import {ApiResult, isApiResult} from "../requests/apiResult"
import ReloadButton from "../components/common/reloadButton"
import {getDispenseNotificationMessages, getPrescriptionOrderMessage} from "../requests/retrievePrescriptionDetails"
import SuccessOrFail from "../components/common/successOrFail"

interface DispensePageProps {
  prescriptionId: string
  amendId?: string
}

interface DispenseResult extends ApiResult {
  withDispenserActive: boolean
}

const DispensePage: React.FC<DispensePageProps> = ({
  prescriptionId,
  amendId
}) => {
  const {baseUrl} = useContext(AppContext)
  const [dispenseFormValues, setDispenseFormValues] = useState<DispenseFormValues>()
  const heading = amendId ? `Amending Dispense: ${amendId}` : "Dispense Prescription"

  const retrievePrescriptionTask = () => retrievePrescriptionDetails(baseUrl, prescriptionId, amendId)
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
              <Label isPageHeading>{heading}</Label>
              <DispenseForm lineItems={lineItems} prescription={prescription} onSubmit={setDispenseFormValues}/>
            </>
          )
        }

        const sendDispenseNotificationTask = () => sendDispenseNotification(baseUrl, prescriptionDetails, dispenseFormValues, amendId)
        return (
          <LongRunningTask<DispenseResult> task={sendDispenseNotificationTask} loadingMessage="Sending dispense notification.">
            {dispenseResult => (
              <>
                <Label isPageHeading>Dispense Result {<SuccessOrFail condition={dispenseResult.success} />}</Label>
                <PrescriptionActions
                  prescriptionId={prescriptionId}
                  cancel
                  claim
                  withdraw
                  statusView
                  dispense={dispenseResult.withDispenserActive}
                />
                <MessageExpanders
                  fhirRequest={dispenseResult.request}
                  hl7V3Request={dispenseResult.request_xml}
                  hl7V3Response={dispenseResult.response_xml}
                  fhirResponse={dispenseResult.response}
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

async function retrievePrescriptionDetails(baseUrl: string, prescriptionId: string, amendId: string | null): Promise<PrescriptionDetails> {
  const prescriptionOrder = await getPrescriptionOrderMessage(baseUrl, prescriptionId)
  let dispenseNotifications = await getDispenseNotificationMessages(baseUrl, prescriptionId)

  if (amendId) {
    const amendNotificationIndex = dispenseNotifications
      .findIndex(dispenseNotification => dispenseNotification.identifier.value === amendId)
    dispenseNotifications = dispenseNotifications
      .slice(0, amendNotificationIndex)
  }

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
  dispenseFormValues: DispenseFormValues,
  amendId: string | null
): Promise<DispenseResult> {
  const dispenseNotification = createDispenseNotification(
    prescriptionDetails.messageHeader,
    prescriptionDetails.patient,
    prescriptionDetails.medicationRequests,
    dispenseFormValues,
    amendId
  )

  const response = await axiosInstance.post<DispenseResult>(`${baseUrl}dispense/dispense`, dispenseNotification)
  response.data.withDispenserActive =
    dispenseFormValues.prescription.statusCode === PrescriptionStatus.PARTIALLY_DISPENSED
  return getResponseDataIfValid(response, isApiResult) as DispenseResult
}

interface PrescriptionDetails {
  messageHeader: fhir.MessageHeader
  patient: fhir.Patient
  medicationRequests: Array<MedicationRequest>
  medicationDispenses: Array<MedicationDispense>
}

export function createStaticLineItemInfoArray(
  medicationRequests: Array<fhir.MedicationRequest>,
  medicationDispenses: Array<MedicationDispense>
): Array<StaticLineItemInfo> {
  return medicationRequests.map(medicationRequest => {
    const lineItemId = getMedicationRequestLineItemId(medicationRequest)
    const medicationDispensesForItem = medicationDispenses.filter(medicationDispense =>
      getMedicationDispenseLineItemId(medicationDispense) === lineItemId
    )
    return createStaticLineItemInfo(medicationRequest, medicationDispensesForItem)
  })
}

function getTotalDispensed(medicationDispenses: Array<fhir.MedicationDispense>) {
  return medicationDispenses
    .map(medicationDispense => medicationDispense.quantity.value)
    .reduce((previousQuantity, currentQuantity) => previousQuantity + currentQuantity)
}

export function createStaticLineItemInfo(
  medicationRequest: fhir.MedicationRequest,
  medicationDispenses: Array<fhir.MedicationDispense>
): StaticLineItemInfo {
  //TODO - use release response not process-message request
  const lineItemInfo: StaticLineItemInfo = {
    id: getMedicationRequestLineItemId(medicationRequest),
    name: medicationRequest.medicationCodeableConcept.coding[0].display,
    prescribedQuantityUnit: medicationRequest.dispenseRequest.quantity.unit,
    prescribedQuantityValue: medicationRequest.dispenseRequest.quantity.value,
    priorStatusCode: LineItemStatus.TO_BE_DISPENSED
  }

  if (medicationDispenses.length > 0) {
    lineItemInfo.dispensedQuantityValue = getTotalDispensed(medicationDispenses)

    const latestMedicationDispense = medicationDispenses.pop()
    lineItemInfo.priorNonDispensingReasonCode = latestMedicationDispense.statusReasonCodeableConcept?.coding?.[0]?.code
    lineItemInfo.priorStatusCode = getLineItemStatus(latestMedicationDispense)
  }

  lineItemInfo.alternativeMedicationAvailable = containsParacetamol(medicationRequest)

  return lineItemInfo
}

export function createStaticPrescriptionInfo(medicationDispenses: Array<fhir.MedicationDispense>): StaticPrescriptionInfo {
  //TODO - use release response
  return {
    dispenseDate: new Date(),
    priorStatusCode: medicationDispenses.length
      ? getPrescriptionStatus(medicationDispenses[medicationDispenses.length - 1])
      : PrescriptionStatus.TO_BE_DISPENSED
  }
}

export function getLineItemStatus(medicationDispense: fhir.MedicationDispense): LineItemStatus {
  return medicationDispense.type.coding[0].code as LineItemStatus
}

function getPrescriptionStatus(medicationDispense: fhir.MedicationDispense): PrescriptionStatus {
  return getTaskBusinessStatusExtension(medicationDispense.extension).valueCoding.code as PrescriptionStatus
}

function containsParacetamol(medicationRequest: fhir.MedicationRequest): boolean {
  return medicationRequest.medicationCodeableConcept.coding[0].code === ("39720311000001101")
}

export function shouldSendCustomFhirRequest(dispenseFormValues: DispenseFormValues) {
  return dispenseFormValues.dispenseType === "custom"
}

export default DispensePage

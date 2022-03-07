import * as React from "react"
import {useContext, useState} from "react"
import {Label, TickIcon, CrossIcon, SummaryList} from "nhsuk-react-components"
import {AppContext} from "../index"
import ButtonList from "../components/common/buttonList"
import LongRunningTask from "../components/common/longRunningTask"
import * as fhir from "fhir/r4"
import MessageExpanders from "../components/messageExpanders"
import ReloadButton from "../components/common/reloadButton"
import {axiosInstance} from "../requests/axiosInstance"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {ApiResult, isApiResult} from "../requests/apiResult"
import * as uuid from "uuid"
import {formatCurrentDateTimeIsoFormat} from "../formatters/dates"
import {VALUE_SET_WITHDRAW_STATUS_REASON} from "../fhir/reference-data/valueSets"
import WithdrawForm, {WithdrawFormValues} from "../components/withdraw/withdrawForm"
import PrescriptionActions from "../components/common/prescriptionActions"
import {getArrayTypeGuard, isBundle} from "../fhir/typeGuards"
import {getMedicationDispenseResources} from "../fhir/bundleResourceFinder"
import {createPrescriptionDispenseEvents, DispenseEventTable} from "../components/prescription-tracker/dispenseEventsTable/dispenseEventTable"

interface WithdrawPageProps {
  prescriptionId?: string
}

interface DispenseNotificationTaskResponse {
  dispenseNotifications: Array<fhir.Bundle>
}

const WithdrawPage: React.FC<WithdrawPageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)
  const [withdrawFormValues, setWithdrawFormValues] = useState<WithdrawFormValues>()

  const retrieveDispenseNotificationsTask = () => retrieveDispenseNotifications(baseUrl, prescriptionId)
  return (
    <LongRunningTask<DispenseNotificationTaskResponse> task={retrieveDispenseNotificationsTask} loadingMessage="Retrieving dispense notifications.">
      {taskResponse => {
        const dispenseEvents = createPrescriptionDispenseEvents(taskResponse.dispenseNotifications)
        const lastDispenseId = dispenseEvents.length > 0
          ? dispenseEvents[dispenseEvents.length - 1].dispenseEventId
          : undefined
        const heading = lastDispenseId
          ? `Withdrawing Dispense: ${lastDispenseId}`
          : "Withdraw Unavailable"
        if (!withdrawFormValues) {
          return (
            <>
              <Label isPageHeading>{heading}</Label>
              <DispenseEventTable events={dispenseEvents} prescriptionId={prescriptionId}/>
              <WithdrawForm prescriptionId={prescriptionId} onSubmit={setWithdrawFormValues}/>
            </>
          )
        }
        const sendWithdrawTask = () => sendWithdraw(baseUrl, prescriptionId, withdrawFormValues)
        const isStillDispensed = taskResponse.dispenseNotifications.length > 0
        return (
          <LongRunningTask<{
            withdrawResponse: ApiResult,
            dispenseNotifications: Array<fhir.Bundle>
          }> task={sendWithdrawTask} loadingMessage="Sending withdraw.">
            {withdrawResult => {
              const {withdrawResponse, dispenseNotifications} = withdrawResult
              const dispenseEvents = createPrescriptionDispenseEvents(dispenseNotifications)
              return (
                <>
                  <Label isPageHeading>Withdraw Result {withdrawResponse.success ? <TickIcon /> : <CrossIcon />}</Label>
                  <SummaryList>
                    <SummaryList.Row>
                      <SummaryList.Key>ID</SummaryList.Key>
                      <SummaryList.Value>{prescriptionId}</SummaryList.Value>
                    </SummaryList.Row>
                  </SummaryList>
                  {isStillDispensed && <DispenseEventTable events={dispenseEvents} prescriptionId={prescriptionId}/>}
                  <PrescriptionActions prescriptionId={prescriptionId} dispense view withdraw={isStillDispensed}/>
                  <MessageExpanders
                    fhirRequest={withdrawResponse.request}
                    hl7V3Request={withdrawResponse.request_xml}
                    fhirResponse={withdrawResponse.response}
                    hl7V3Response={withdrawResponse.response_xml}
                  />
                  <ButtonList>
                    <ReloadButton />
                  </ButtonList>
                </>
              )
            }}
          </LongRunningTask>
        )
      }}
    </LongRunningTask>
  )
}

async function retrieveDispenseNotifications(baseUrl: string, prescriptionId: string): Promise<DispenseNotificationTaskResponse> {
  const dispenseNotificationsResponse = await axiosInstance.get<Array<fhir.Bundle>>(`${baseUrl}dispenseNotifications/${prescriptionId}`)
  const dispenseNotifications = getResponseDataIfValid(dispenseNotificationsResponse, getArrayTypeGuard(isBundle))
  return {dispenseNotifications}
}

async function sendWithdraw(
  baseUrl: string,
  prescriptionId: string,
  withdrawFormValues: WithdrawFormValues
): Promise<{withdrawResponse: ApiResult, dispenseNotifications: Array<fhir.Bundle>}> {
  const dispenseNotificationsResponse = await axiosInstance.get<Array<fhir.Bundle>>(`${baseUrl}dispenseNotifications/${prescriptionId}`)
  const dispenseNotifications = getResponseDataIfValid(dispenseNotificationsResponse, getArrayTypeGuard(isBundle))
  const lastDispenseNotification = dispenseNotifications[dispenseNotifications.length - 1]
  const medicationDispense = getMedicationDispenseResources(lastDispenseNotification)[0]

  const withdrawMessage = createWithdraw(withdrawFormValues, lastDispenseNotification, medicationDispense)
  const withdrawResponse = await axiosInstance.post<ApiResult>(`${baseUrl}dispense/withdraw`, withdrawMessage)
  return {
    withdrawResponse: getResponseDataIfValid(withdrawResponse, isApiResult),
    dispenseNotifications: dispenseNotifications.slice(0, -1)
  }
}

function createWithdraw(withdrawFormValues: WithdrawFormValues, dispenseNotification: fhir.Bundle, medicationDispense: fhir.MedicationDispense): fhir.Task {
  const {id, identifier} = dispenseNotification
  const {system, value} = medicationDispense.subject.identifier
  const bundleIdentifier = uuid.v4()

  return {
    resourceType: "Task",
    id,
    identifier: [
      {
        system: "https://tools.ietf.org/html/rfc4122",
        value: bundleIdentifier
      }
    ],
    status: "in-progress",
    intent: "order",
    groupIdentifier: {
      system: "https://fhir.nhs.uk/Id/prescription-order-number",
      value: withdrawFormValues.prescriptionId
    },
    code: {
      coding: [
        {
          system: "http://hl7.org/fhir/CodeSystem/task-code",
          code: "abort",
          display: "Mark the focal resource as no longer active"
        }
      ]
    },
    focus: {
      type: "Bundle",
      identifier
    },
    for: {
      identifier: {
        system,
        value
      }
    },
    authoredOn: formatCurrentDateTimeIsoFormat(),
    owner: {
      identifier: {
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: getWithdrawPharmacy(withdrawFormValues)
      }
    },
    statusReason: createStatusReason(withdrawFormValues)
  }
}

function getWithdrawPharmacy(withdrawFormValues: WithdrawFormValues) {
  return withdrawFormValues.pharmacy === "custom"
    ? withdrawFormValues.customPharmacy
    : withdrawFormValues.pharmacy
}

function createStatusReason(withdrawFormValues: WithdrawFormValues): fhir.CodeableConcept {
  return {
    coding: VALUE_SET_WITHDRAW_STATUS_REASON.filter(coding => coding.code === withdrawFormValues.reason)
  }
}

export default WithdrawPage

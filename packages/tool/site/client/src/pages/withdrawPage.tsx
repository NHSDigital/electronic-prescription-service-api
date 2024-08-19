import * as React from "react"
import {useContext, useState} from "react"
import {Label, SummaryList} from "nhsuk-react-components"
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
import {createPrescriptionDispenseEvents, DispenseEventTable} from "../components/dispenseEventsTable/dispenseEventTable"
import SuccessOrFail from "../components/common/successOrFail"

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
        const {dispenseNotifications} = taskResponse
        const dispenseEvents = createPrescriptionDispenseEvents(dispenseNotifications)
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
              <DispenseEventTable events={dispenseEvents} prescriptionId={prescriptionId} />
              <WithdrawForm prescriptionId={prescriptionId} onSubmit={setWithdrawFormValues} />
            </>
          )
        }

        const sendWithdrawTask = () => sendWithdraw(baseUrl, dispenseNotifications, withdrawFormValues)
        return (
          <LongRunningTask<ApiResult> task={sendWithdrawTask} loadingMessage="Sending withdraw.">
            {withdrawResult => {
              const remainingDispenseNotifications = dispenseNotifications.slice(0, -1)
              const remainingEvents = createPrescriptionDispenseEvents(remainingDispenseNotifications)
              const isStillDispensed = remainingDispenseNotifications.length > 0
              return (
                <>
                  <Label isPageHeading>Withdraw Result {<SuccessOrFail condition={withdrawResult.success} />}</Label>
                  <SummaryList>
                    <SummaryList.Row>
                      <SummaryList.Key>ID</SummaryList.Key>
                      <SummaryList.Value>{prescriptionId}</SummaryList.Value>
                    </SummaryList.Row>
                  </SummaryList>
                  {isStillDispensed && <DispenseEventTable events={remainingEvents} prescriptionId={prescriptionId} />}
                  <PrescriptionActions prescriptionId={prescriptionId} cancel dispense statusView withdraw={isStillDispensed} />
                  <MessageExpanders
                    fhirRequest={withdrawResult.request}
                    hl7V3Request={withdrawResult.request_xml}
                    hl7V3Response={withdrawResult.response_xml}
                    fhirResponse={withdrawResult.response}
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
  dispenseNotifications: Array<fhir.Bundle>,
  withdrawFormValues: WithdrawFormValues
): Promise<ApiResult> {
  const lastDispenseNotification = dispenseNotifications[dispenseNotifications.length - 1]
  const medicationDispense = getMedicationDispenseResources(lastDispenseNotification)[0]
  const withdrawMessage = createWithdraw(withdrawFormValues, lastDispenseNotification, medicationDispense)
  const withdrawResponse = await axiosInstance.post<ApiResult>(`${baseUrl}dispense/withdraw`, withdrawMessage)
  return getResponseDataIfValid(withdrawResponse, isApiResult)
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
    contained: [
      {
        resourceType: "PractitionerRole",
        id: "requester",
        identifier: [
          {
            system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
            value: "555086415105"
          }
        ],
        practitioner: {
          identifier: {
            system: "https://fhir.nhs.uk/Id/sds-user-id",
            value: "3415870201"
          },
          display: "Ms Lottie Maifeld"
        },
        organization: {
          reference: "#organisation"
        },
        code: [
          {
            coding: [
              {
                system: "https://fhir.nhs.uk/CodeSystem/NHSDigital-SDS-JobRoleCode",
                code: "S8000:G8000:R8000",
                display: "Clinical Practitioner Access Role"
              }
            ]
          }
        ],
        telecom: [
          {
            system: "phone",
            use: "work",
            value: "01234567890"
          }
        ]
      },
      {
        resourceType: "Organization",
        id: "organisation",
        identifier: [
          {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: "FA565"
          }
        ],
        address: [
          {
            city: "West Yorkshire",
            use: "work",
            line: [
              "17 Austhorpe Road",
              "Crossgates",
              "Leeds"
            ],
            postalCode: "LS15 8BA"
          }
        ],
        active: true,
        type: [
          {
            coding: [
              {
                system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
                code: "182",
                display: "PHARMACY"
              }
            ]
          }
        ],
        name: "The Simple Pharmacy",
        telecom: [
          {
            system: "phone",
            use: "work",
            value: "0113 3180277"
          }
        ]
      }
    ],
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
    statusReason: createStatusReason(withdrawFormValues),
    requester: {
      reference: "#requester"
    }
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

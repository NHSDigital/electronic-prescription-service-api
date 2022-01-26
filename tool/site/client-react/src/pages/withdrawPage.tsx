import * as React from "react"
import {useContext, useState} from "react"
import {Label, TickIcon, CrossIcon} from "nhsuk-react-components"
import {AppContext} from "../index"
import ButtonList from "../components/buttonList"
import LongRunningTask from "../components/longRunningTask"
import * as fhir from "fhir/r4"
import MessageExpanders from "../components/messageExpanders"
import ReloadButton from "../components/reloadButton"
import {axiosInstance} from "../requests/axiosInstance"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {ApiResult, isApiResult} from "../requests/apiResult"
import * as uuid from "uuid"
import {formatCurrentDateTimeIsoFormat} from "../formatters/dates"
import {VALUE_SET_WITHDRAW_STATUS_REASON} from "../fhir/reference-data/valueSets"
import WithdrawForm, {WithdrawFormValues} from "../components/withdraw/withdrawForm"
import PrescriptionActions from "../components/prescriptionActions"

interface WithdrawPageProps {
  prescriptionId?: string
}

const WithdrawPage: React.FC<WithdrawPageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)
  const [withdrawFormValues, setWithdrawFormValues] = useState<WithdrawFormValues>()
  if (!withdrawFormValues) {
    return (
      <>
        <Label isPageHeading>Withdraw prescription</Label>
        <WithdrawForm prescriptionId={prescriptionId} onSubmit={setWithdrawFormValues}/>
      </>
    )
  }
  const sendWithdrawTask = () => sendWithdraw(baseUrl, withdrawFormValues)
  return (
    <LongRunningTask<ApiResult> task={sendWithdrawTask} loadingMessage="Sending withdraw.">
      {withdrawResult => (
        <>
          <Label isPageHeading>Withdraw Result {withdrawResult.success ? <TickIcon /> : <CrossIcon />}</Label>
          <PrescriptionActions prescriptionId={prescriptionId} dispense view/>
          <MessageExpanders
            fhirRequest={withdrawResult.request}
            hl7V3Request={withdrawResult.request_xml}
            fhirResponse={withdrawResult.response}
            hl7V3Response={withdrawResult.response_xml}
          />
          <ButtonList>
            <ReloadButton />
          </ButtonList>
        </>
      )}
    </LongRunningTask>
  )
}

async function sendWithdraw(
  baseUrl: string,
  withdrawFormValues: WithdrawFormValues
): Promise<ApiResult> {
  const withdrawMessage = createWithdraw(withdrawFormValues)
  const withResponse = await axiosInstance.post<ApiResult>(`${baseUrl}dispense/withdraw`, withdrawMessage)
  return getResponseDataIfValid(withResponse, isApiResult)
}

function createWithdraw(withdrawFormValues: WithdrawFormValues): fhir.Task {
  const identifier = uuid.v4()
  const bundleIdentifier = identifier

  return {
    resourceType: "Task",
    id: identifier,
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
      identifier: {
        system: "https://tools.ietf.org/html/rfc4122",
        value: bundleIdentifier
      }
    },
    for: {
      identifier: {
        system: "https://fhir.nhs.uk/Id/nhs-number",
        value: "9999999999"
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

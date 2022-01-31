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
import {VALUE_SET_RETURN_STATUS_REASON} from "../fhir/reference-data/valueSets"
import ReturnForm, {ReturnFormValues} from "../components/return/returnForm"

interface ReturnPageProps {
  prescriptionId?: string
}

const ReturnPage: React.FC<ReturnPageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)
  const [returnFormValues, setReturnFormValues] = useState<ReturnFormValues>()
  if (!returnFormValues) {
    return (
      <>
        <Label isPageHeading>Return prescription</Label>
        <ReturnForm prescriptionId={prescriptionId} onSubmit={setReturnFormValues} />
      </>
    )
  }
  const sendReturnTask = () => sendReturn(baseUrl, returnFormValues)
  return (
    <LongRunningTask<ApiResult> task={sendReturnTask} loadingMessage="Sending return.">
      {returnResult => (
        <>
          <Label isPageHeading>Return Result {returnResult.success ? <TickIcon /> : <CrossIcon />}</Label>
          <MessageExpanders
            fhirRequest={returnResult.request}
            hl7V3Request={returnResult.request_xml}
            fhirResponse={returnResult.response}
            hl7V3Response={returnResult.response_xml}
          />
          <ButtonList>
            <ReloadButton />
          </ButtonList>
        </>
      )}
    </LongRunningTask>
  )
}

async function sendReturn(
  baseUrl: string,
  returnFormValues: ReturnFormValues
): Promise<ApiResult> {
  const returnParameters = createReturn(returnFormValues)
  const returnResponse = await axiosInstance.post<ApiResult>(`${baseUrl}dispense/return`, returnParameters)
  return getResponseDataIfValid(returnResponse, isApiResult)
}

function createReturn(returnFormValues: ReturnFormValues): fhir.Task {
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
    status: "rejected",
    intent: "order",
    groupIdentifier: {
      system: "https://fhir.nhs.uk/Id/prescription-order-number",
      value: returnFormValues.prescriptionId
    },
    code: {
      coding: [
        {
          system: "http://hl7.org/fhir/CodeSystem/task-code",
          code: "change",
          display: "Change the focal resource"
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
        value: getReturnPharmacy(returnFormValues)
      }
    },
    statusReason: createStatusReason(returnFormValues)
  }
}

function getReturnPharmacy(returnFormValues: ReturnFormValues) {
  return returnFormValues.pharmacy === "custom"
    ? returnFormValues.customPharmacy
    : returnFormValues.pharmacy
}

function createStatusReason(returnFormValues: ReturnFormValues): fhir.CodeableConcept {
  return {
    coding: VALUE_SET_RETURN_STATUS_REASON.filter(coding => coding.code === returnFormValues.reason)
  }
}

export default ReturnPage

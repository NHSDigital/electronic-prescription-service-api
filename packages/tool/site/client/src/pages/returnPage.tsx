import * as React from "react"
import {useContext, useState} from "react"
import {Label} from "nhsuk-react-components"
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
import {VALUE_SET_RETURN_STATUS_REASON} from "../fhir/reference-data/valueSets"
import ReturnForm, {ReturnFormValues} from "../components/return/returnForm"
import SuccessOrFail from "../components/common/successOrFail"

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
          <Label isPageHeading>Return Result {<SuccessOrFail condition={returnResult.success} />}</Label>
          <MessageExpanders
            fhirRequest={returnResult.request}
            hl7V3Request={returnResult.request_xml}
            hl7V3Response={returnResult.response_xml}
            fhirResponse={returnResult.response}
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
    contained: [{
      resourceType: "PractitionerRole",
      id: "requester",
      identifier: [
        {
          system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
          value: "641555508105"
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
    }],
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
    statusReason: createStatusReason(returnFormValues),
    requester: {
      reference: "#requester"
    }
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

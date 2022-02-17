import * as React from "react"
import {useContext} from "react"
import {Label, TickIcon, CrossIcon} from "nhsuk-react-components"
import {AppContext} from "../index"
import ButtonList from "../components/buttonList"
import LongRunningTask from "../components/longRunningTask"
import MessageExpanders from "../components/messageExpanders"
import {axiosInstance} from "../requests/axiosInstance"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {ApiResult, isApiResult} from "../requests/apiResult"
import BackButton from "../components/backButton"
import {Bundle} from "fhir/r4"
import * as uuid from "uuid"
import {formatCurrentDateTimeIsoFormat} from "../formatters/dates"

interface VerifyPageProps {
  prescriptionId?: string
}

const VerifyPage: React.FC<VerifyPageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)

  const sendVerifyTask = () => sendVerify(baseUrl, prescriptionId)
  return (
    <LongRunningTask<ApiResult> task={sendVerifyTask} loadingMessage="Verifying prescription.">
      {verifyResult => (
        <>
          <Label isPageHeading>Verify Result {verifyResult.success ? <TickIcon /> : <CrossIcon />}</Label>
          <MessageExpanders
            fhirRequest={verifyResult.request}
            fhirResponse={verifyResult.response}
          />
          <ButtonList>
            <BackButton />
          </ButtonList>
        </>
      )}
    </LongRunningTask>
  )
}

async function sendVerify(
  baseUrl: string,
  prescriptionId: string
): Promise<ApiResult> {
  const releaseResponse = (await axiosInstance.get<Bundle>(`${baseUrl}dispense/release/${prescriptionId}`)).data

  const identifier = uuid.v4()
  const verifyRequest = {
    resourceType: "Bundle",
    id: identifier,
    meta: {
      lastUpdated : formatCurrentDateTimeIsoFormat()
    },
    identifier: {
      system: "https://tools.ietf.org/html/rfc4122",
      value: identifier
    },
    type: "searchset",
    total: 1,
    entry: [{fullUrl: `urn:uuid:${releaseResponse.id}`, resource: releaseResponse}]
  }

  const verifyResponse = await axiosInstance.post<ApiResult>(`${baseUrl}dispense/verify`, verifyRequest)
  return getResponseDataIfValid(verifyResponse, isApiResult)
}

export default VerifyPage

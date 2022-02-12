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
  const verifyResponse = await axiosInstance.post<ApiResult>(`${baseUrl}dispense/verify`, releaseResponse)
  return getResponseDataIfValid(verifyResponse, isApiResult)
}

export default VerifyPage

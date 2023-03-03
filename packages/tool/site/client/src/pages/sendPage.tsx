import * as React from "react"
import * as fhir from "fhir/r4"
import {AppContext} from "../index"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {axiosInstance} from "../requests/axiosInstance"
import {isRedirect, redirect, Redirect} from "../browser/navigation"
import {Loading} from "../components/common/loading"
import {ResultSummaries} from "../components/send/resultSummaries"
import {ResultDetail} from "../components/send/resultDetail"

interface SendPageProps {
  token: string
  state?: string
}

const SendPage: React.FC<SendPageProps> = ({
  token,
  state
}) => {
  const {baseUrl} = React.useContext(AppContext)
  const [sendResultState, setSendResultState] = React.useState<SendResults | Redirect>({results: []})

  React.useEffect(() => {
    (async() => {
      if (isRedirect(sendResultState)) {
        return
      }

      if (isSendResult(sendResultState)) {
        if (!sendResultState.results.length) {
          setSendResultState(await getPrescriptionsToSend(baseUrl, token, state))
        }
        const pendingSendResults = sendResultState.results.filter(r => r.success === "unknown")
        if (pendingSendResults.length) {
          const deltaResults = (await sendNextPrescriptionBatch(baseUrl, token, pendingSendResults)).results
          const deltaResultPrescriptionIds = deltaResults.map(result => result.prescription_id)

          const previousResults = sendResultState.results.filter(result => !deltaResultPrescriptionIds.includes(result.prescription_id))
          const mergedResult = {
            results: previousResults.concat(deltaResults).sort((a, b) => parseInt(a.bundle_id) - parseInt(b.bundle_id))
          }
          setSendResultState(mergedResult)
        }
      }
    })()
  }, [baseUrl, state, token, sendResultState, setSendResultState])

  if (isRedirect(sendResultState)) {
    return null
  }

  if (isSendResult(sendResultState)) {
    if (sendResultState.results.length === 1) {
      return <ResultDetail sendResultDetail={sendResultState.results[0]}/>
    }
    return <ResultSummaries sendResults={sendResultState}/>
  }

  return <Loading message="Sending prescription(s)" />
}

async function getPrescriptionsToSend(
  baseUrl: string,
  token: string,
  state?: string
): Promise<SendResults | Redirect> {
  const request = {signatureToken: token, state}
  const response = await axiosInstance.post<SendResults | Redirect>(`${baseUrl}sign/download-signatures`, request)
  if (isRedirect(response.data)) {
    redirect(response.data.redirectUri)
    return response.data
  }
  return getResponseDataIfValid(response, isSendResult)
}

async function sendNextPrescriptionBatch(
  baseUrl: string,
  token: string,
  results: Array<SendResultDetail>
): Promise<SendResults> {
  const request = {signatureToken: token, results: results.slice(0, 25)}
  const response = await axiosInstance.post<SendResults>(`${baseUrl}api/prescribe/send`, request)
  return getResponseDataIfValid(response, isSendResult)
}

function isSendResult(response: unknown): response is SendResults {
  return (response as SendResults).results !== undefined
}

export interface SendResults {
  results: Array<SendResultDetail>
}

export interface SendResultDetail {
  prescription_id: string
  bundle_id: string
  request?: fhir.Bundle
  request_xml?: string
  response?: fhir.FhirResource
  response_xml: string
  success: boolean | "unknown"
}

export default SendPage

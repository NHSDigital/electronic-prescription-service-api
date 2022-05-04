import * as React from "react"
import * as fhir from "fhir/r4"
import {useContext, useEffect, useState} from "react"
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
  const {baseUrl} = useContext(AppContext)
  const [sendResultState, setSendResultState] = useState<SendResult | Redirect>({results: []})

  useEffect(() => {
    (async() => {
      if (isRedirect(sendResultState)) {
        return
      }

      if (isResult(sendResultState)) {
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

  if (isResult(sendResultState)) {
    if (sendResultState.results.length === 1) {
      return <ResultDetail sendResultDetail={sendResultState.results[0]}/>
    }
    return <ResultSummaries sendResult={sendResultState}/>
  }

  return <Loading message="Sending prescription(s)" />
}

async function getPrescriptionsToSend(
  baseUrl: string,
  token: string,
  state?: string
): Promise<SendResult | Redirect> {
  const request = {signatureToken: token, state}
  const response = await axiosInstance.post<SendResult | Redirect>(`${baseUrl}sign/download-signatures`, request)
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
): Promise<SendResult> {
  const request = {signatureToken: token, results: results.slice(0, 25)}
  const response = await axiosInstance.post<SendResult>(`${baseUrl}api/prescribe/send`, request)
  return getResponseDataIfValid(response, isResult)
}

function isSendResult(data: unknown): data is SendResult {
  if (isResult(data as SendResult)) {
    return true
  }
}

function isResult(response: SendResult): response is SendResult {
  return (response as SendResult).results !== undefined
}

export interface SendResult {
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

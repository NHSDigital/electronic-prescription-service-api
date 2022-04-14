import * as React from "react"
import {useContext, useEffect, useState} from "react"
import {AppContext} from "../index"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {axiosInstance} from "../requests/axiosInstance"
import {isApiResult, ApiResult} from "../requests/apiResult"
import {isRedirect, redirect, Redirect} from "../browser/navigation"
import {Loading} from "../components/common/loading"
import {BulkResultTable} from "../components/send/bulkResultTable"

interface SendPostSignPageProps {
  token: string
  state?: string
}

const SendPostSignPage: React.FC<SendPostSignPageProps> = ({
  token,
  state
}) => {
  const {baseUrl} = useContext(AppContext)
  const [sendResultState, setSendResultState] = useState<SendResult | SendBulkResult | Redirect>({results: []})

  useEffect(() => {
    (async() => {
      if (isRedirect(sendResultState)) {
        return
      }

      // if (isApiResult(sendResultState)) {

      // }

      if (isBulkResult(sendResultState)) {
        if (!sendResultState.results.length) {
          setSendResultState(await sendPrescription(baseUrl, token, state))
        }
        const pendingSendResults = sendResultState.results.filter(r => r.success === "unknown")
        if (pendingSendResults.length) {
          const deltaResult = await sendNextPrescriptionBatch(baseUrl, token, pendingSendResults)
          const previousResult = sendResultState.results.filter(r => !deltaResult.results.map(r => r.prescription_id).includes(r.prescription_id))
          const mergedResult = {
            results: previousResult.concat(deltaResult.results).sort((a, b) => parseInt(a.bundle_id) - parseInt(b.bundle_id))
          }
          setSendResultState(mergedResult)
        }
      }
    })()
  }, [baseUrl, state, token, sendResultState, setSendResultState])

  if (isRedirect(sendResultState)) {
    return null
  }
  if (isBulkResult(sendResultState)) {
    return <BulkResultTable bulkResults={sendResultState}/>
  }
  return <Loading message="Sending prescription(s)" />
}

async function sendPrescription(
  baseUrl: string,
  token: string,
  state?: string
): Promise<SendResult | SendBulkResult | Redirect> {
  const request = {signatureToken: token, state}
  const response = await axiosInstance.post<SendResult | SendBulkResult | Redirect>(`${baseUrl}prescribe/send`, request)
  if (isRedirect(response.data)) {
    redirect(response.data.redirectUri)
    return response.data
  }
  return getResponseDataIfValid(response, isSendResultOrSendBulkResult)
}

async function sendNextPrescriptionBatch(
  baseUrl: string,
  token: string,
  results: Array<SendBulkResultDetail>
): Promise<SendBulkResult> {
  const request = {signatureToken: token, results: results.slice(0, 25)}
  const response = await axiosInstance.post<SendBulkResult>(`${baseUrl}api/prescribe/send`, request)
  return getResponseDataIfValid(response, isBulkResult)
}

function isSendResultOrSendBulkResult(data: unknown): data is SendResult | SendBulkResult | Redirect {
  if (isBulkResult(data as SendBulkResult)) {
    return true
  }
  if (!isApiResult(data)) {
    return false
  }
  const sendResult = data as SendResult
  return typeof sendResult.prescription_id === "string"
}

function isBulkResult(response: SendResult | SendBulkResult): response is SendBulkResult {
  return (response as SendBulkResult).results !== undefined
}

interface SendResult extends ApiResult {
  prescription_id: string
}

export interface SendBulkResult {
  results: Array<SendBulkResultDetail>
}

interface SendBulkResultDetail {
  prescription_id: string
  bundle_id: string
  success: boolean | "unknown"
}

export default SendPostSignPage

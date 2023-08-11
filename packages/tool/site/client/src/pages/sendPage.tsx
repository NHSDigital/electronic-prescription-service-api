import * as React from "react"
import * as fhir from "fhir/r4"
import {useContext, useEffect, useState} from "react"
import {AppContext} from "../index"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {axiosInstance} from "../requests/axiosInstance"
import {Loading} from "../components/common/loading"
import {ResultSummaries} from "../components/send/resultSummaries"
import {ResultDetail} from "../components/send/resultDetail"
import {createPrescriptionSummaryViewProps} from "../components/prescription-summary"

interface SendPageProps {
  token: string
  state?: string
}

const SendPage: React.FC<SendPageProps> = ({
  token,
  state
}) => {
  const {baseUrl} = useContext(AppContext)
  const [sendResultState, setSendResultState] = useState<SendResults>({results: []})

  useEffect(() => {
    (async() => {
      let toSend = sendResultState
      if (!toSend.results.length) {
        toSend = await getPrescriptionsToSend(baseUrl)
      }
      const pendingSendResults = toSend.results.filter(r => r.success === "unknown")
      if (pendingSendResults.length) {
        const deltaResults = (await sendNextPrescriptionBatch(baseUrl, token, pendingSendResults)).results
        const deltaResultPrescriptionIds = deltaResults.map(result => result.prescription_id)
        if (pendingSendResults.filter(result => deltaResultPrescriptionIds.includes(result.prescription_id)).length) {
          const previousResults = toSend.results.filter(result => !deltaResultPrescriptionIds.includes(result.prescription_id))
          const mergedResult = {
            results: previousResults.concat(deltaResults).sort((a, b) => parseInt(a.bundle_id) - parseInt(b.bundle_id))
          }
          setSendResultState(mergedResult)
        }
      }
    })().catch(console.error)
  }, [baseUrl, state, token, sendResultState, setSendResultState])

  if (sendResultState.results.length > 0) {
    if (sendResultState.results.length === 1) {
      return <ResultDetail sendResultDetail={sendResultState.results[0]}/>
    }
    return <ResultSummaries sendResults={sendResultState}/>
  }

  return <Loading message="Sending prescription(s)" />
}

async function getPrescriptionsToSend(
  baseUrl: string
): Promise<SendResults> {
  const bundles = (await axiosInstance.get(`${baseUrl}prescriptions`)).data as Array<fhir.Bundle>
  return {
    results: bundles.map(bundle => {
      const prescriptionSummaryViewProps = createPrescriptionSummaryViewProps(bundle)
      return {
        prescription_id: prescriptionSummaryViewProps.prescriptionLevelDetails.prescriptionId,
        bundle_id: bundle.id,
        success: "unknown"
      }
    })
  }
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
  response_xml?: string
  success: boolean | "unknown"
}

export default SendPage

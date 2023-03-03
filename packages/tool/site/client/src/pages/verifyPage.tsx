import * as React from "react"
import {Label} from "nhsuk-react-components"
import {AppContext} from "../index"
import {axiosInstance} from "../requests/axiosInstance"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {Bundle} from "fhir/r4"
import * as uuid from "uuid"
import {formatCurrentDateTimeIsoFormat} from "../formatters/dates"
import VerifyResult, {VerifyApiResult} from "../components/verify/verifyResult"
import VerifyForm, {VerifyFormValues} from "../components/verify/verifyForm"

interface VerifyPageProps {
  prescriptionId?: string
}

const VerifyPage: React.FC<VerifyPageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = React.useContext(AppContext)
  const sendVerifyByPrescripionIdTask = () => sendVerifyByPrescriptionId(baseUrl, prescriptionId)

  const initialValues = {verifyRequest: ""}
  const [verifyFormValues, setVerifyFormValues] = React.useState<VerifyFormValues>(initialValues)
  const sendVerifyByPayloadTask = () => sendVerify(baseUrl, verifyFormValues)

  if (!prescriptionId) {
    if (verifyFormValues.verifyRequest) {
      return <VerifyResult task={sendVerifyByPayloadTask}/>
    }
    return (
      <>
        <Label isPageHeading>Verify prescription(s)</Label>
        <VerifyForm initialValues={initialValues} onSubmit={setVerifyFormValues} />
      </>
    )
  }

  return <VerifyResult task={sendVerifyByPrescripionIdTask}/>
}

async function sendVerifyByPrescriptionId(
  baseUrl: string,
  prescriptionId: string
): Promise<VerifyApiResult> {
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

  const verifyResponse = await axiosInstance.post<VerifyApiResult>(`${baseUrl}dispense/verify`, verifyRequest)
  return getResponseDataIfValid(verifyResponse, isVerifyResponse)
}

async function sendVerify(
  baseUrl: string,
  verifyFormValues: VerifyFormValues
): Promise<VerifyApiResult> {
  const verifyResponse = await axiosInstance.post<VerifyApiResult>(
    `${baseUrl}dispense/verify`,
    JSON.parse(verifyFormValues.verifyRequest)
  )
  return getResponseDataIfValid(verifyResponse, isVerifyResponse)
}

function isVerifyResponse(data: unknown): data is VerifyApiResult {
  return !!(data as VerifyApiResult).results?.length
}

export default VerifyPage

import * as React from "react"
import {useContext} from "react"
import {Label, TickIcon, CrossIcon, Table} from "nhsuk-react-components"
import {AppContext} from "../index"
import ButtonList from "../components/buttonList"
import LongRunningTask from "../components/longRunningTask"
import MessageExpanders from "../components/messageExpanders"
import {axiosInstance} from "../requests/axiosInstance"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {ApiResult} from "../requests/apiResult"
import BackButton from "../components/backButton"
import {Bundle} from "fhir/r4"
import * as uuid from "uuid"
import {formatCurrentDateTimeIsoFormat} from "../formatters/dates"

interface VerifyPageProps {
  prescriptionId?: string
}

interface VerifyApiResult extends ApiResult {
  results: Array<SignatureResult>
}

interface SignatureResult {
  name: string
  success: boolean
}

const VerifyPage: React.FC<VerifyPageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)

  const sendVerifyTask = () => sendVerify(baseUrl, prescriptionId)
  return (
    <LongRunningTask<VerifyApiResult> task={sendVerifyTask} loadingMessage="Verifying prescription.">
      {verifyResult => (
        <>
          <Label isPageHeading>Verify Result {verifyResult.success ? <TickIcon /> : <CrossIcon />}</Label>
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.Cell>Signature Name</Table.Cell>
                <Table.Cell>Success</Table.Cell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {verifyResult.results.map(result => (
                <Table.Row key={result.name}>
                  <Table.Cell>{result.name}</Table.Cell>
                  <Table.Cell>{result.success ? <TickIcon/> : <CrossIcon/>}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
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

function isVerifyResponse(data: unknown): data is VerifyApiResult {
  return !!(data as VerifyApiResult).results?.length
}

export default VerifyPage

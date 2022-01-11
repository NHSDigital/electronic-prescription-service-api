import * as React from "react"
import {useContext, useState} from "react"
import {Label, TickIcon, CrossIcon, Table} from "nhsuk-react-components"
import {AppContext} from "../index"
import ButtonList from "../components/buttonList"
import LongRunningTask from "../components/longRunningTask"
import * as fhir from "fhir/r4"
import PrescriptionActions from "../components/prescriptionActions"
import MessageExpanders from "../components/messageExpanders"
import ReloadButton from "../components/reloadButton"
import * as uuid from "uuid"
import ReleaseForm, {ReleaseFormValues} from "../components/release/releaseForm"
import {axiosInstance} from "../requests/axiosInstance"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {ApiResult, isApiResult} from "../requests/apiResult"
import styled from "styled-components"

interface ReleasePageProps {
  prescriptionId?: string
}

interface ReleaseResult extends ApiResult {
  prescriptionIds: Array<string>
}

const StyledTable = styled(Table)`
  .nhsuk-action-link {
    margin-bottom: 0;
  }
`

const ReleasePage: React.FC<ReleasePageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)
  const [releaseFormValues, setReleaseFormValues] = useState<ReleaseFormValues>()
  if (!releaseFormValues) {
    return (
      <>
        <Label isPageHeading>Release prescription(s)</Label>
        <ReleaseForm prescriptionId={prescriptionId} onSubmit={setReleaseFormValues} />
      </>
    )
  }
  const sendReleaseTask = () => sendRelease(baseUrl, releaseFormValues)
  return (
    <LongRunningTask<ReleaseResult> task={sendReleaseTask} loadingMessage="Sending release.">
      {releaseResult => (
        <>
          <Label isPageHeading>Release Result {releaseResult.success ? <TickIcon /> : <CrossIcon />}</Label>
          <StyledTable caption="Prescriptions Released">
            <Table.Head>
              <Table.Row>
                <Table.Cell>ID</Table.Cell>
                <Table.Cell>Actions</Table.Cell>
                <Table.Cell />
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {releaseResult.prescriptionIds.map(prescriptionId => (
                <Table.Row key={prescriptionId}>
                  <Table.Cell>{prescriptionId}</Table.Cell>
                  <Table.Cell><PrescriptionActions prescriptionId={prescriptionId} dispense /></Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </StyledTable>
          <MessageExpanders
            fhirRequest={releaseResult.request}
            hl7V3Request={releaseResult.request_xml}
            fhirResponse={releaseResult.response}
            hl7V3Response={releaseResult.response_xml}
          />
          <ButtonList>
            <ReloadButton />
          </ButtonList>
        </>
      )}
    </LongRunningTask>
  )
}

async function sendRelease(
  baseUrl: string,
  releaseFormValues: ReleaseFormValues
): Promise<ReleaseResult> {
  const releaseParameters = createRelease(releaseFormValues)
  const releaseResponse = await axiosInstance.post<ReleaseResult>(`${baseUrl}dispense/release`, releaseParameters)
  return getResponseDataIfValid(releaseResponse, isApiResult) as ReleaseResult
}

function createRelease(releaseFormValues: ReleaseFormValues): fhir.Parameters {
  if (shouldSendCustomFhirRequest(releaseFormValues)) {
    return JSON.parse(releaseFormValues.customReleaseFhir)
  }

  const releasePharmacy = getReleasePharmacy(releaseFormValues)

  const nominatedPharmacyRelease: fhir.Parameters = {
    resourceType: "Parameters",
    id: uuid.v4(),
    parameter: [
      {
        name: "owner",
        valueIdentifier: {
          system: "https://fhir.nhs.uk/Id/ods-organization-code",
          value: releasePharmacy
        }
      },
      {
        name: "status",
        valueCode: "accepted"
      },
      {
        name: "agent",
        resource: {
          resourceType: "PractitionerRole",
          telecom: [
            {
              system: "phone",
              value: "02380798431",
              use: "work"
            }
          ]
        }
      }
    ]
  }

  if (shouldSendNominatedPharmacyRequest(releaseFormValues)) {
    return nominatedPharmacyRelease
  }

  const patientRelease: fhir.Parameters = {
    ...nominatedPharmacyRelease,
    parameter: [
      ...nominatedPharmacyRelease.parameter,
      {
        name: "group-identifier",
        valueIdentifier: {
          system: "https://fhir.nhs.uk/Id/prescription-order-number",
          value: releaseFormValues.prescriptionId
        }
      }
    ]
  }

  return patientRelease
}

function shouldSendCustomFhirRequest(releaseFormValues: ReleaseFormValues) {
  return releaseFormValues.releaseType === "custom"
}

function getReleasePharmacy(releaseFormValues: ReleaseFormValues) {
  return releaseFormValues.pharmacy === "custom"
    ? releaseFormValues.customPharmacy
    : releaseFormValues.pharmacy
}

function shouldSendNominatedPharmacyRequest(releaseFormValues: ReleaseFormValues) {
  return releaseFormValues.releaseType !== "prescriptionId"
}

export default ReleasePage

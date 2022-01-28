import * as React from "react"
import {useContext, useState} from "react"
import {Label, TickIcon, CrossIcon, Table} from "nhsuk-react-components"
import styled from "styled-components"
import {useCookies} from "react-cookie"
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

interface ReleasePageProps {
  prescriptionId?: string
}

interface ReleaseResult extends ApiResult {
  prescriptionIds: Array<string>
  withDispenser: boolean
}

const StyledTable = styled(Table)`
  .nhsuk-action-link {
    margin-bottom: 0;
  }
`

const attendedAgent: fhir.FhirResource = {
  resourceType: "PractitionerRole",
  telecom: [
    {
      system: "phone",
      value: "02380798431",
      use: "work"
    }
  ]
}

const unattendedAgent = {
  ...attendedAgent,
  identifier:  [
    {
      system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
      value: "555086415105"
    }
  ],
  practitioner: {
    identifier: {
      system: "https://fhir.nhs.uk/Id/sds-user-id",
      value: "3415870201"
    },
    display: "Jackie Clark"
  },
  organization: {
    identifier: {
      system: "https://fhir.nhs.uk/Id/ods-organization-code",
      value: "RHM"
    },
    display: "UNIVERSITY HOSPITAL SOUTHAMPTON NHS FOUNDATION TRUST"
  },
  code:  [
    {
      coding:  [
        {
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          code: "R8000",
          display: "Clinical Practitioner Access Role"
        }
      ]
    }
  ]
}

const ReleasePage: React.FC<ReleasePageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)
  const [cookies] = useCookies()

  const authLevel = cookies["Auth-Level"]

  const [releaseFormValues, setReleaseFormValues] = useState<ReleaseFormValues>()
  if (!releaseFormValues) {
    return (
      <>
        <Label isPageHeading>Release prescription(s)</Label>
        <ReleaseForm prescriptionId={prescriptionId} onSubmit={setReleaseFormValues} />
      </>
    )
  }
  const sendReleaseTask = () => sendRelease(baseUrl, releaseFormValues, authLevel)
  return (
    <LongRunningTask<ReleaseResult> task={sendReleaseTask} loadingMessage="Sending release.">
      {releaseResult => (
        <>
          <Label isPageHeading>Release Result {releaseResult.success ? <TickIcon /> : <CrossIcon />}</Label>
          {releaseResult.prescriptionIds.length > 0 &&
            <>
              <StyledTable caption="Prescriptions Released">
                <Table.Head>
                  <Table.Row>
                    <Table.Cell>ID</Table.Cell>
                    <Table.Cell>Actions</Table.Cell>
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
            </>
          }
          {releaseResult.withDispenser &&
            <>
              <p>Prescription has been released by a dispenser.</p>
              <PrescriptionActions prescriptionId={releaseFormValues.prescriptionId} view />
            </>
          }
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
  releaseFormValues: ReleaseFormValues,
  authLevel: "user" | "system"
): Promise<ReleaseResult> {
  const releaseParameters = createRelease(releaseFormValues, authLevel)
  const releaseResponse = await axiosInstance.post<ReleaseResult>(`${baseUrl}dispense/release`, releaseParameters)
  return getResponseDataIfValid(releaseResponse, isApiResult) as ReleaseResult
}

function createRelease(releaseFormValues: ReleaseFormValues, authLevel: "user" | "system"): fhir.Parameters {
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
        resource: authLevel === "user" ? attendedAgent : unattendedAgent
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

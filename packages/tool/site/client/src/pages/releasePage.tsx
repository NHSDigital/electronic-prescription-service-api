import * as React from "react"
import {useContext, useState} from "react"
import {Label, Table} from "nhsuk-react-components"
import styled from "styled-components"
import {useCookies} from "react-cookie"
import {AppContext} from "../index"
import ButtonList from "../components/common/buttonList"
import LongRunningTask from "../components/common/longRunningTask"
import * as fhir from "fhir/r4"
import PrescriptionActions from "../components/common/prescriptionActions"
import MessageExpanders from "../components/messageExpanders"
import ReloadButton from "../components/common/reloadButton"
import * as uuid from "uuid"
import ReleaseForm, {ReleaseFormValues} from "../components/release/releaseForm"
import {axiosInstance} from "../requests/axiosInstance"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {ApiResult, isApiResult} from "../requests/apiResult"
import SuccessOrFail from "../components/common/successOrFail"

interface ReleasePageProps {
  prescriptionId?: string
}

interface ReleaseResult extends ApiResult {
  prescriptionIds: Array<string>
  withDispenser?: DispenserDetails
}

export interface DispenserDetails {
  odsCode: string
  name: string
  tel: string
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
  identifier: [
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
  code: [
    {
      coding: [
        {
          system: "https://fhir.nhs.uk/CodeSystem/NHSDigital-SDS-JobRoleCode",
          code: "S8000:G8000:R8000",
          display: "Clinical Practitioner Access Role"
        }
      ]
    }
  ]
}

const organization: fhir.Organization = {
  resourceType: "Organization",
  id: "organization",
  identifier: [
    {
      system: "https://fhir.nhs.uk/Id/ods-organization-code",
      value: "FA565"
    }
  ],
  address: [
    {
      city: "West Yorkshire",
      use: "work",
      line: [
        "17 Austhorpe Road",
        "Crossgates",
        "Leeds"
      ],
      "postalCode": "LS15 8BA"
    }
  ],
  type: [
    {
      coding: [
        {
          system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
          code: "182",
          display: "PHARMACY"
        }
      ]
    }
  ],
  name: "The Simple Pharmacy",
  telecom: [
    {
      system: "phone",
      use: "work",
      value: "0113 3180277"
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
          <Label isPageHeading>Release Result {<SuccessOrFail condition={releaseResult.success} />}</Label>
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
                      <Table.Cell><PrescriptionActions prescriptionId={prescriptionId} releaseReturn dispense /></Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </StyledTable>
            </>
          }
          {releaseResult.withDispenser &&
            <>
              <p>Prescription has been released by {releaseResult.withDispenser.name} - {releaseResult.withDispenser.odsCode}.</p>
              <p>Tel: {releaseResult.withDispenser.tel}.</p>
              <PrescriptionActions prescriptionId={releaseFormValues.prescriptionId} cancel statusView />
            </>
          }
          <MessageExpanders
            fhirRequest={releaseResult.request}
            hl7V3Request={releaseResult.request_xml}
            hl7V3Response={releaseResult.response_xml}
            fhirResponse={releaseResult.response}
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
  authLevel: "User" | "System"
): Promise<ReleaseResult> {
  const releaseParameters = createRelease(releaseFormValues, authLevel)
  const releaseResponse = await axiosInstance.post<ReleaseResult>(`${baseUrl}dispense/release`, releaseParameters)
  return getResponseDataIfValid(releaseResponse, isApiResult) as ReleaseResult
}

export function createRelease(releaseFormValues: ReleaseFormValues, authLevel: "User" | "System"): fhir.Parameters {
  if (shouldSendCustomFhirRequest(releaseFormValues)) {
    return JSON.parse(releaseFormValues.customReleaseFhir)
  }

  if (releaseFormValues.pharmacy !== "custom" && releaseFormValues.pharmacy !== "") {
    organization.identifier[0].value = releaseFormValues.pharmacy
  } else if(releaseFormValues.customPharmacy) {
    organization.identifier[0].value = releaseFormValues.customPharmacy
  }

  const nominatedPharmacyRelease: fhir.Parameters = {
    resourceType: "Parameters",
    id: uuid.v4(),
    parameter: [
      {
        name: "owner",
        resource: organization
      },
      {
        name: "status",
        valueCode: "accepted"
      },
      {
        name: "agent",
        resource: authLevel === "User" ? attendedAgent : unattendedAgent
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

function shouldSendNominatedPharmacyRequest(releaseFormValues: ReleaseFormValues) {
  return releaseFormValues.releaseType !== "prescriptionId"
}

export default ReleasePage

import * as React from "react"
import {useContext, useState} from "react"
import {Label, TickIcon, CrossIcon} from "nhsuk-react-components"
import {AppContext} from "../index"
import ButtonList from "../components/buttonList"
import LongRunningTask from "../components/longRunningTask"
import * as fhir from "fhir/r4"
import PrescriptionActions from "../components/prescriptionActions"
import MessageExpanders from "../components/messageExpanders"
import ReloadButton from "../components/reloadButton"
import axios from "axios"
import * as uuid from "uuid"
import ReleaseForm, {ReleaseFormValues} from "../components/release/releaseForm"

interface ReleasePageProps {
  prescriptionId?: string
}

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
          <Label isPageHeading>Release Result {releaseResult.success ? <TickIcon/> : <CrossIcon/>}</Label>
          {prescriptionId &&
            <PrescriptionActions prescriptionId={prescriptionId} dispense claim view/>
          }
          <MessageExpanders
            fhirRequest={releaseResult.request}
            hl7V3Request={releaseResult.request_xml}
            fhirResponse={releaseResult.response}
            hl7V3Response={releaseResult.response_xml}
          />
          <ButtonList>
            <ReloadButton/>
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
  const release = createRelease(releaseFormValues)

  const response = await axios.post<ReleaseResult>(`${baseUrl}dispense/release`, release)
  console.log(release)
  console.log(response)

  return response.data
}

function createRelease(releaseFormValues: ReleaseFormValues): fhir.Parameters {

  const releasePharmacy =
    releaseFormValues.releasePharmacy === "custom"
      ? releaseFormValues.customReleasePharmacy
      : releaseFormValues.releasePharmacy

  const release: fhir.Parameters = {
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
      }
    ]
  }

  if (releaseFormValues.releaseType === "prescriptionId") {
    release.parameter.push({
      "name": "group-identifier",
      "valueIdentifier": {
        "system": "https://fhir.nhs.uk/Id/prescription-order-number",
        "value": releaseFormValues.prescriptionId
      }
    })
  }

  return release
}

export default ReleasePage

interface ReleaseResult {
  success: boolean
  request: fhir.Bundle
  request_xml: string
  response: fhir.OperationOutcome
  response_xml: string
}

import * as React from "react"
import { useContext, useState } from "react"
import {Label, Button, Form, Fieldset, TickIcon, CrossIcon, Radios} from "nhsuk-react-components"
import {AppContext} from "../index"
import {Formik} from "formik"
import ButtonList from "../components/buttonList"
import BackButton from "../components/backButton"
import LongRunningTask from "../components/longRunningTask"
import * as fhir from "fhir/r4"
import PrescriptionActions from "../components/prescriptionActions"
import MessageExpanders from "../components/messageExpanders"
import ReloadButton from "../components/reloadButton"
import axios from "axios"
import RadioField from "../components/radioField"
import * as uuid from "uuid"

interface ReleasePageProps {
  prescriptionId?: string
}

interface ReleaseFormProps {
  onSubmit: (values: ReleaseFormValues) => void
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
        <ReleaseForm onSubmit={setReleaseFormValues} />
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

const ReleaseForm: React.FC<ReleaseFormProps> = ({
  onSubmit
}) => {
  const initialValues: ReleaseFormValues = {releaseType: null, releasePharmacy: null}
  return (
    <Formik<ReleaseFormValues> initialValues={initialValues} onSubmit={values => onSubmit(values)}>
      {formik =>
        <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
          <Fieldset>
            {/* <RadioField
              name="releaseType"
              label="Choose how you want to release prescription(s)"
              fieldRadios={[
                {
                  value: "all",
                  text: "All nominated prescriptions for the below pharmacy"
                },
                {
                  value: "prescriptionId",
                  text: "A single prescription by ID"
                },{
                  value: "custom",
                  text: "With a FHIR release message"
                }
              ]}
            /> */}
            <RadioField
              name="releasePharmacy"
              label="Pharmacy to release prescriptions to"
              fieldRadios={[
                {
                  value: "VNFKT",
                  text: "VNFKT - FIVE STAR HOMECARE LEEDS LTD"
                },
                {
                  value: "YGM1E",
                  text: "YGM1E - MBBM HEALTHCARE TECHNOLOGIES LTD"
                },
                // {
                //   value: "custom",
                //   text: "Other"
                // }
              ]}
            />
          </Fieldset>
          <ButtonList>
            <Button type="submit">Release</Button>
            <BackButton/>
          </ButtonList>
        </Form>
      }
    </Formik>
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

function createRelease(
  releaseFormValues: ReleaseFormValues
): fhir.Parameters {
  const release: fhir.Parameters = {
    resourceType: "Parameters",
    id: uuid.v4(),
    parameter: [
      {
        name: "owner",
        valueIdentifier: {
          system: "https://fhir.nhs.uk/Id/ods-organization-code",
          value: releaseFormValues.releasePharmacy
        }
      },
      {
        name: "status",
        valueCode: "accepted"
      }
    ]
  }
  return release
}

export default ReleasePage

export interface ReleaseFormValues {
  releaseType: string,
  releasePharmacy: string
}

// todo: genericise? wrap messageExpanders to deconstruct result properties??
interface ReleaseResult {
  success: boolean
  request: fhir.Bundle
  request_xml: string
  response: fhir.OperationOutcome
  response_xml: string
}

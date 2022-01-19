import * as React from "react"
import {useContext, useState} from "react"
import {Label, TickIcon, CrossIcon, Form, Button} from "nhsuk-react-components"
import {AppContext} from "../index"
import ButtonList from "../components/buttonList"
import LongRunningTask from "../components/longRunningTask"
import * as fhir from "fhir/r4"
import MessageExpanders from "../components/messageExpanders"
import ReloadButton from "../components/reloadButton"
import {axiosInstance} from "../requests/axiosInstance"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {ApiResult, isApiResult} from "../requests/apiResult"
import {Formik} from "formik"
import BackButton from "../components/backButton"

interface ReturnPageProps {
  prescriptionId?: string
}

interface ReturnFormValues {
  prescriptionId: string
}

const ReturnPage: React.FC<ReturnPageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)
  const [returnFormValues, setReturnFormValues] = useState<ReturnFormValues>()
  if (!returnFormValues) {
    return (
      <>
        <Label isPageHeading>Release prescription(s)</Label>
        <ReturnForm prescriptionId={prescriptionId} onSubmit={setReturnFormValues} />
      </>
    )
  }
  const sendReleaseTask = () => sendReturn(baseUrl, returnFormValues)
  return (
    <LongRunningTask<ApiResult> task={sendReleaseTask} loadingMessage="Sending release.">
      {returnResult => (
        <>
          <Label isPageHeading>Return Result {returnResult.success ? <TickIcon /> : <CrossIcon />}</Label>
          <MessageExpanders
            fhirRequest={returnResult.request}
            hl7V3Request={returnResult.request_xml}
            fhirResponse={returnResult.response}
            hl7V3Response={returnResult.response_xml}
          />
          <ButtonList>
            <ReloadButton />
          </ButtonList>
        </>
      )}
    </LongRunningTask>
  )
}

interface ReturnFormProps {
  prescriptionId?: string
  onSubmit: (values: ReturnFormValues) => void
}

const ReturnForm: React.FC<ReturnFormProps> = ({
  prescriptionId,
  onSubmit
}) => {
  const initialValues: ReturnFormValues = {prescriptionId}

  return (
    <Formik<ReturnFormValues> initialValues={initialValues} onSubmit={values => onSubmit(values)}>
      {formik =>
        <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
          <ButtonList>
            <Button type="submit">Return</Button>
            <BackButton/>
          </ButtonList>
        </Form>
      }
    </Formik>
  )
}

async function sendReturn(
  baseUrl: string,
  releaseFormValues: ReturnFormValues
): Promise<ApiResult> {
  const returnParameters = createReturn(releaseFormValues)
  const releaseResponse = await axiosInstance.post<ApiResult>(`${baseUrl}dispense/return`, returnParameters)
  return getResponseDataIfValid(releaseResponse, isApiResult)
}

function createReturn(releaseFormValues: ReturnFormValues): fhir.Task {
  return {
    resourceType: "Task",
    id: "ee1b55f8-113c-4725-99a3-25fbad366dd6",
    identifier: [
      {
        system: "https://tools.ietf.org/html/rfc4122",
        value: "add2e9dd-da0a-c266-a4e3-447c68239525"
      }
    ],
    status: "rejected",
    intent: "order",
    groupIdentifier: {
      system: "https://fhir.nhs.uk/Id/prescription-order-number",
      value: releaseFormValues.prescriptionId
    },
    code: {
      coding: [
        {
          system: "http://hl7.org/fhir/CodeSystem/task-code",
          code: "change",
          display: "Change the focal resource"
        }
      ]
    },
    focus: {
      type: "Bundle",
      identifier: {
        system: "https://tools.ietf.org/html/rfc4122",
        value: "67c585f6-f4b5-4f53-861a-50c07ecff5d4"
      }
    },
    for: {
      identifier: {
        system: "https://fhir.nhs.uk/Id/nhs-number",
        value: "9449304289"
      }
    },
    authoredOn: "2016-03-10T22:39:32-04:00",
    owner: {
      identifier: {
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: "VNFKT"
      }
    },
    statusReason: {
      coding: [
        {
          system: "https://fhir.nhs.uk/CodeSystem/EPS-task-dispense-return-status-reason",
          code: "0002",
          display: "Unable to dispense medication on prescriptions"
        }
      ]
    }
  }
}

export default ReturnPage

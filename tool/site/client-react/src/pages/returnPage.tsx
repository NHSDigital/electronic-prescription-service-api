import * as React from "react"
import {useContext, useState} from "react"
import {Label, TickIcon, CrossIcon, Form, Button, Fieldset, SummaryList} from "nhsuk-react-components"
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
import * as uuid from "uuid"
import {formatCurrentDateTimeIsoFormat} from "../formatters/dates"
import PharmacyRadios from "../components/pharmacies"
import RadioField from "../components/radioField"
import {convertCodingsToOptions} from "../components/selectField"
import {VALUE_SET_RETURN_STATUS_REASON} from "../fhir/reference-data/valueSets"

interface ReturnPageProps {
  prescriptionId?: string
}

interface ReturnFormValues {
  prescriptionId: string
  pharmacy: string
  reason: string
  customPharmacy?: string
}

const ReturnPage: React.FC<ReturnPageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)
  const [returnFormValues, setReturnFormValues] = useState<ReturnFormValues>()
  if (!returnFormValues) {
    return (
      <>
        <Label isPageHeading>Return prescription</Label>
        <ReturnForm prescriptionId={prescriptionId} onSubmit={setReturnFormValues} />
      </>
    )
  }
  const sendReturnTask = () => sendReturn(baseUrl, returnFormValues)
  return (
    <LongRunningTask<ApiResult> task={sendReturnTask} loadingMessage="Sending return.">
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
  const initialValues: ReturnFormValues = {prescriptionId, pharmacy: "VNFKT", reason: "0002"}
  return (
    <>
      <SummaryList>
        <SummaryList.Row>
          <SummaryList.Key>ID</SummaryList.Key>
          <SummaryList.Value>{prescriptionId}</SummaryList.Value>
        </SummaryList.Row>
      </SummaryList>
      <Formik<ReturnFormValues> initialValues={initialValues} onSubmit={values => onSubmit(values)}>
        {formik => <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
          <Fieldset>
            <PharmacyRadios
              label="Pharmacy returning prescription"
              defaultValue={initialValues.pharmacy}
              value={formik.values.pharmacy}
              error={formik.errors.pharmacy} />
            <RadioField
              name="reason"
              label="Choose a reason for returning"
              defaultValue={initialValues.reason}
              fieldRadios={convertCodingsToOptions(VALUE_SET_RETURN_STATUS_REASON)} />
          </Fieldset>
          <ButtonList>
            <Button type="submit">Return</Button>
            <BackButton />
          </ButtonList>
        </Form>}
      </Formik>
    </>
  )
}

async function sendReturn(
  baseUrl: string,
  returnFormValues: ReturnFormValues
): Promise<ApiResult> {
  const returnParameters = createReturn(returnFormValues)
  const returnResponse = await axiosInstance.post<ApiResult>(`${baseUrl}dispense/return`, returnParameters)
  return getResponseDataIfValid(returnResponse, isApiResult)
}

function createReturn(returnFormValues: ReturnFormValues): fhir.Task {
  const identifier = uuid.v4()
  const bundleIdentifier = identifier

  return {
    resourceType: "Task",
    id: identifier,
    identifier: [
      {
        system: "https://tools.ietf.org/html/rfc4122",
        value: bundleIdentifier
      }
    ],
    status: "rejected",
    intent: "order",
    groupIdentifier: {
      system: "https://fhir.nhs.uk/Id/prescription-order-number",
      value: returnFormValues.prescriptionId
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
        value: bundleIdentifier
      }
    },
    for: {
      identifier: {
        system: "https://fhir.nhs.uk/Id/nhs-number",
        value: "9999999999"
      }
    },
    authoredOn: formatCurrentDateTimeIsoFormat(),
    owner: {
      identifier: {
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: getReturnPharmacy(returnFormValues)
      }
    },
    statusReason: {
      coding: [
        createStatusReason(returnFormValues)
      ]
    }
  }
}

function getReturnPharmacy(returnFormValues: ReturnFormValues) {
  return returnFormValues.pharmacy === "custom"
    ? returnFormValues.customPharmacy
    : returnFormValues.pharmacy
}

function createStatusReason(returnFormValues: ReturnFormValues): fhir.CodeableConcept {
  return {
    coding: VALUE_SET_RETURN_STATUS_REASON.filter(coding => coding.code === returnFormValues.reason)
  }
}

export default ReturnPage

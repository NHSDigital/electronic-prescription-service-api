import {Label} from "nhsuk-react-components"
import * as React from "react"
import {AppContext} from "../index"
import {axiosInstance} from "../requests/axiosInstance"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import DoseToTextResult, {DoseToTextApiResult} from "../components/dose-to-text/doseToTextResult"
import DoseToTextForm, {DoseToTextFormValues} from "../components/dose-to-text/doseToTextForm"

const DoseToTextPage: React.FC = () => {
  const {baseUrl} = React.useContext(AppContext)
  const initialValues = {doseToTextRequest: ""}
  const [doseToTextFormValues, setDoseToTextFormValues] = React.useState<DoseToTextFormValues>(initialValues)
  const sendDoseToTextByPayloadTask = () => sendDoseToText(baseUrl, doseToTextFormValues)

  if (doseToTextFormValues.doseToTextRequest) {
    return <DoseToTextResult task={sendDoseToTextByPayloadTask}/>
  }

  // eslint-disable-next-line max-len
  const exampleLink = "https://simplifier.net/guide/NHSDigital-Medicines/Home/Examples/AllExamples/Messageprescription-order/PrescriptionOrderHomecarePrepare.guide.md?version=current"

  return (
    <>
      <Label isPageHeading>Dose to Text</Label>
      <p>This form only accepts valid FHIR JSON of the type: prescription-order Bundles OR MedicationRequest</p>
      <p>A valid example Bundle can be found <a href={exampleLink}>here</a>.</p>
      <p>The dosageInstruction field can be edited independently of the rest of the message for testing purposes.</p>
      <DoseToTextForm initialValues={initialValues} onSubmit={setDoseToTextFormValues} />
    </>
  )
}

async function sendDoseToText(
  baseUrl: string,
  doseToTextFormValues: DoseToTextFormValues
): Promise<DoseToTextApiResult> {
  const doseToTextResponse = await axiosInstance.post<DoseToTextApiResult>(
    `${baseUrl}dose-to-text`,
    JSON.parse(doseToTextFormValues.doseToTextRequest)
  )
  return getResponseDataIfValid(doseToTextResponse, isDoseToTextResponse)
}

function isDoseToTextResponse(data: unknown): data is DoseToTextApiResult {
  return !!(data as DoseToTextApiResult).results?.length
}

export default DoseToTextPage

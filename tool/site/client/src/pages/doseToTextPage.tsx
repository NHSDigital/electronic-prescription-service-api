import {Label} from "nhsuk-react-components"
import * as React from "react"
import {useContext} from "react"
import {AppContext} from "../index"
import {axiosInstance} from "../requests/axiosInstance"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import DoseToTextResult, {DoseToTextApiResult} from "../components/dose-to-text/doseToTextResult"
import DoseToTextForm, {DoseToTextFormValues} from "../components/dose-to-text/doseToTextForm"

const DoseToTextPage: React.FC = () => {
  const {baseUrl} = useContext(AppContext)
  const initialValues = {doseToTextRequest: ""}
  const [doseToTextFormValues, setDoseToTextFormValues] = React.useState<DoseToTextFormValues>(initialValues)
  const sendDoseToTextByPayloadTask = () => sendDoseToText(baseUrl, doseToTextFormValues)
  console.log(doseToTextFormValues)

  if (doseToTextFormValues.doseToTextRequest) {
    return <DoseToTextResult task={sendDoseToTextByPayloadTask}/>
  }
  return (
    <>
      <Label isPageHeading>Dose to Text</Label>
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

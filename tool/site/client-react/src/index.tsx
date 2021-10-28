import * as React from "react"
import {PageContainer} from "./components/pageContainer"
import PrescriptionSummary from "./components/prescription-summary/prescriptionSummary"
import * as ReactDOM from "react-dom"
import {Button} from "nhsuk-react-components"
import {OperationOutcome} from "../../client/models"
import axios from "axios"

const customWindow = window as Record<string, any>

interface signResponse {
  redirectUri?: string
  prepareErrors?: Array<OperationOutcome>
}

async function sendSignRequest(baseUrl: string) {
  try {
    const response = await axios.post<signResponse>(`${baseUrl}prescribe/sign`)
    if (response.data.prepareErrors) {
      const prepareErrors = response.data.prepareErrors
      prepareErrors
        .flatMap(error => error.issue)
        .filter(issue => issue.severity === "error")
        .filter(issue => !issue.diagnostics.startsWith("Unable to find matching profile for urn:uuid:"))
        .map(issue => issue.diagnostics)
        .forEach(diagnostic => console.log(diagnostic))
    } else if (response.data.redirectUri) {
      //TODO REACT redirect when router
      window.location.href = response.data.redirectUri
    } else {
      console.log(`Unable to sign prescription, this is most likely because your session has expired. Please try to change-auth or login again`)
    }
  } catch (e) {
    console.log(e)
  }
}

async function startApplication (baseUrl: string): Promise<void> {
  const urlParams = new URLSearchParams(window.location.search)
  const content = (
    <PageContainer>
      <PrescriptionSummary
        baseUrl={baseUrl}
        prescriptionId={urlParams.get("prescription_id")}
      />
      <div>
        <Button onClick={() => sendSignRequest(baseUrl)}>Send</Button>
        <Button secondary href={baseUrl}>Back</Button>
      </div>
    </PageContainer>
  )
  ReactDOM.render(content, document.getElementById("root"))
}

customWindow.startApplication = startApplication

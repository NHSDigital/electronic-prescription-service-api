import * as React from "react"
import {PageContainer} from "./components/pageContainer"
import * as ReactDOM from "react-dom"
import {OperationOutcome} from "fhir/r4"
import axios from "axios"
import Claim from "./components/claim/claim"

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
  /*const content = (
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
  )*/
  //TODO - revert
  const dispensedProducts = [
    {
      id: "d97818ca-26e6-4b43-980e-9dbe7cb5743d",
      productName: "Diclofenac potassium 50mg tablets",
      status: "Fully Dispensed",
      quantityDispensed: "28 tablet"
    },
    {
      id: "251e614d-1098-4f5b-a4e0-b5929a9bd808",
      productName: "Morphine 15mg modified-release tablets",
      status: "Fully Dispensed",
      quantityDispensed: "28 tablet"
    }
  ]
  const content = (
    <PageContainer>
      <Claim dispensedProducts={dispensedProducts}/>
    </PageContainer>
  )
  ReactDOM.render(content, document.getElementById("root"))
}

customWindow.startApplication = startApplication

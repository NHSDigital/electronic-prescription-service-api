import * as React from "react"
import {PageContainer} from "./components/pageContainer"
import PrescriptionSummary from "./components/prescription-summary/prescriptionSummary"
import * as ReactDOM from "react-dom"
import Claim from "./components/claim/claim"

const customWindow = window as Record<string, any>

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

async function startApplication (baseUrl: string): Promise<void> {
  // todo: get baseUrl to handle non-local environments
  const urlParams = new URLSearchParams(window.location.search)

  // const content = (
  //   <PageContainer>
  //     <PrescriptionSummary
  //       baseUrl={baseUrl}
  //       prescriptionId={urlParams.get("prescription_id")}
  //     />
  //   </PageContainer>
  // )
  const content = (
    <PageContainer>
      <Claim dispensedProducts={dispensedProducts}/>
    </PageContainer>
  )
  ReactDOM.render(content, document.getElementById("root"))
}

customWindow.startApplication = startApplication

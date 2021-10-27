import * as React from "react"
import {PageContainer} from "./components/pageContainer"
import PrescriptionSummary from "./components/prescription-summary/prescriptionSummary"
import * as ReactDOM from "react-dom"

const customWindow = window as Record<string, any>

async function startApplication (baseUrl: string): Promise<void> {
  // todo: get baseUrl to handle non-local environments
  const urlParams = new URLSearchParams(window.location.search)

  const content = (
    <PageContainer>
      <PrescriptionSummary
        baseUrl={baseUrl}
        prescriptionId={urlParams.get("prescription_id")}
      />
    </PageContainer>
  )
  ReactDOM.render(content, document.getElementById("root"))
}

customWindow.startApplication = startApplication

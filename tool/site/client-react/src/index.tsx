import * as React from "react"
import {PageContainer} from "./components/pageContainer"
import {PrescriptionSummary} from "./components/prescription-summary/prescriptionSummary"
import ReactDOM = require("react-dom")

(async function () {
  // todo: get baseUrl to handle non-local environments
  const baseUrl = "/"
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
}())

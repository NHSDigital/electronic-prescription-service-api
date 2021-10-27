import {Bundle} from "fhir/r4"
import * as React from "react"
import {
  createPrescriptionSummaryProps,
  PrescriptionSummary
} from "./components/prescription-summary/prescriptionSummary"
import {PageContainer} from "./components/pageContainer"
import ReactDOM = require("react-dom")

(async function() {
  const baseUrl = "/"
  const urlParams = new URLSearchParams(window.location.search)
  const prescriptionId = urlParams.get("prescription_id")
  const getPrescriptionResponse: Response = await fetch(`${baseUrl}prescription/${prescriptionId}`)
  const bundle: Bundle = await getPrescriptionResponse.json()
  const prescriptionSummaryProps = createPrescriptionSummaryProps(bundle)
  const content = (
    <PageContainer>
      <PrescriptionSummary
        patient={prescriptionSummaryProps.patient}
        practitionerRole={prescriptionSummaryProps.practitionerRole}
      />
    </PageContainer>
  )
  ReactDOM.render(content, document.getElementById("root"))
}())

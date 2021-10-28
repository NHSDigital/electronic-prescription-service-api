import PrescriptionSummaryView, {
  createSummaryPrescription,
  SummaryPrescription
} from "./prescriptionSummaryView"
import * as React from "react"
import {useState} from "react"
import {Label} from "nhsuk-react-components"

interface PrescriptionSummaryProps {
  baseUrl: string
  prescriptionId: string
}

const PrescriptionSummary: React.FC<PrescriptionSummaryProps> = ({
  baseUrl,
  prescriptionId
}) => {
  const [summaryViewProps, setSummaryViewProps] = useState<SummaryPrescription>()

  if (!summaryViewProps) {
    fetch(`${baseUrl}prescription/${prescriptionId}`)
      .then(response => response.json())
      .then(createSummaryPrescription)
      .then(setSummaryViewProps)
  }

  return (
    <>
      {summaryViewProps
        ? <PrescriptionSummaryView
          patient={summaryViewProps.patient}
          practitionerRole={summaryViewProps.practitionerRole}
        />
        : <Label isPageHeading>Loading</Label>}
    </>
  )
}

export default PrescriptionSummary

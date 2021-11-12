import PrescriptionSummaryView, {createSummaryPrescription, SummaryPrescription} from "./prescriptionSummaryView"
import * as React from "react"
import {useEffect, useState} from "react"
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

  useEffect(() => {
    if (!summaryViewProps) {
      fetch(`${baseUrl}prescription/${prescriptionId}`)
        .then(response => response.json())
        .then(createSummaryPrescription)
        .then(setSummaryViewProps)
    }
  }, [summaryViewProps, baseUrl, prescriptionId])

  return summaryViewProps
    ? <PrescriptionSummaryView {...summaryViewProps}/>
    : <Label isPageHeading>Retrieving Prescription Summary...</Label>
}

export default PrescriptionSummary

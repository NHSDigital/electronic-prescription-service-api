import PrescriptionSummaryView, {createSummaryPrescription, SummaryPrescription} from "./prescriptionSummaryView"
import * as React from "react"
import {useCallback, useEffect, useState} from "react"
import {Label} from "nhsuk-react-components"
import {useCookies} from "react-cookie"

const customWindow = window as Record<string, any>

interface PrescriptionSummaryProps {
  baseUrl: string
  prescriptionId: string
}

const PrescriptionSummary: React.FC<PrescriptionSummaryProps> = ({
  baseUrl,
  prescriptionId
}) => {
  const [summaryViewProps, setSummaryViewProps] = useState<SummaryPrescription>()

  // todo: move this logic to load/edit page so this component is more reusable
  const [addedListener, setAddedListener] = useState(false)
  const [cookies] = useCookies()
  const LEFT_ARROW_KEY = 37
  const RIGHT_ARROW_KEY = 39
  const handleKeyDown = useCallback((e: any) => {
    if (e.keyCode === LEFT_ARROW_KEY) {
      const previousPrescriptionId = cookies["Previous-Prescription-Id"]
      if (previousPrescriptionId) {
        customWindow.location = `${baseUrl}prescribe/edit?prescription_id=${previousPrescriptionId}`
      }
    } else if (e.keyCode === RIGHT_ARROW_KEY) {
      const nextPrescriptionId = cookies["Next-Prescription-Id"]
      if (nextPrescriptionId) {
        customWindow.location = `${baseUrl}prescribe/edit?prescription_id=${nextPrescriptionId}`
      }
    }
  }, [baseUrl, cookies])

  useEffect(() => {
    if (!addedListener) {
      document.addEventListener("keydown", handleKeyDown)
    }
    setAddedListener(true)

    if (!summaryViewProps) {
      fetch(`${baseUrl}prescription/${prescriptionId}`)
        .then(response => response.json())
        .then(createSummaryPrescription)
        .then(setSummaryViewProps)
    }
  }, [baseUrl, prescriptionId, summaryViewProps, addedListener, handleKeyDown])

  return summaryViewProps
    ? <PrescriptionSummaryView {...summaryViewProps}/>
    : <Label isPageHeading>Retrieving Prescription Summary...</Label>
}

export default PrescriptionSummary

import PrescriptionSummaryView, {createSummaryPrescription, SummaryPrescription} from "./prescriptionSummaryView"
import * as React from "react"
import {Redirect} from "react-router-dom"
import {useEffect, useState} from "react"
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
  const [currentPrescriptionId, setCurrentPrescriptionId] = useState(prescriptionId)

  let addedListener = false
  useEffect(() => {
    if (!addedListener) {
      document.addEventListener('keydown', handleKeyDown)
    }
    addedListener = true

    if (!summaryViewProps) {
      fetch(`${baseUrl}prescription/${currentPrescriptionId}`)
        .then(response => response.json())
        .then(createSummaryPrescription)
        .then(setSummaryViewProps)
    }
  }, [summaryViewProps])

  const [cookies, _] = useCookies()

  const LEFT_ARROW_KEY = 37
  const RIGHT_ARROW_KEY = 39

  function handleKeyDown(e) {
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
  }

  return summaryViewProps
    ? <PrescriptionSummaryView {...summaryViewProps}/>
    : <Label isPageHeading>Retrieving Prescription Summary...</Label>
}

export default PrescriptionSummary

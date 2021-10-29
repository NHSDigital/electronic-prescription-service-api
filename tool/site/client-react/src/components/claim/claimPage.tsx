import * as React from "react"
import {useEffect, useState} from "react"
import {ErrorMessage, Label} from "nhsuk-react-components"
import Claim, {ClaimProps} from "./claim"
import axios from "axios"
import {
  getMedicationDispenseResources,
  getMedicationRequestResources,
  getPatientResources
} from "../../fhir/bundleResourceFinder"
import {Bundle} from "fhir/r4"

interface ClaimPageProps {
  baseUrl: string
  prescriptionId: string
}

const ClaimPage: React.FC<ClaimPageProps> = ({
  baseUrl,
  prescriptionId
}) => {
  const [claimProps, setClaimProps] = useState<ClaimProps>()
  const [error, setError] = useState<string>()

  async function retrievePrescriptionDetails() {
    const {data: prescriptionOrder} = await axios.get<Bundle>(
      `${baseUrl}prescription/${prescriptionId}`
    )
    if (!prescriptionOrder) {
      setError("Prescription not found. Is the ID correct?")
      return
    }

    const {data: dispenseNotifications} = await axios.get<Array<Bundle>>(
      `${baseUrl}dispense/history?prescription_id=${prescriptionId}`
    )
    if (!dispenseNotifications?.length) {
      setError("Dispense history not found. Has this prescription been dispensed?")
      return
    }

    const patients = getPatientResources(prescriptionOrder)
    const medicationRequests = getMedicationRequestResources(prescriptionOrder)
    const medicationDispenses = dispenseNotifications.map(getMedicationDispenseResources)
      .reduce((a, b) => a.concat(b), [])

    setClaimProps({
      patient: patients[0],
      medicationRequests: medicationRequests,
      medicationDispenses: medicationDispenses
    })
  }

  useEffect(() => {
    if (!claimProps) {
      retrievePrescriptionDetails().catch(error => {
        console.log(error)
        setError("Failed to retrieve prescription details.")
      })
    }
  }, [claimProps])

  return (
    <>
      {!error && !claimProps && <Label isPageHeading>Retrieving Dispense History...</Label>}
      {error && <>
        <Label isPageHeading>Error</Label>
        <ErrorMessage>{error}</ErrorMessage>
      </>}
      {claimProps && <Claim {...claimProps}/>}
    </>
  )
}

export default ClaimPage

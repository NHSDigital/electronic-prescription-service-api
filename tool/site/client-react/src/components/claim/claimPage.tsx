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

  useEffect(() => {
    if (!claimProps) {
      axios.get<HistoryResponse>(`${baseUrl}dispense/history?prescription_id=${prescriptionId}`)
        .then(({data}) => {
          const prescriptionOrder = data.prescription_order
          const dispenseNotifications = data.dispense_notifications
          if (!prescriptionOrder || !dispenseNotifications) {
            setError("Incomplete dispensing history for prescription. Has this prescription been dispensed yet?")
          } else {
            setClaimProps({
              patient: (getPatientResources(prescriptionOrder))[0],
              medicationRequests: getMedicationRequestResources(prescriptionOrder),
              medicationDispenses: dispenseNotifications.map(getMedicationDispenseResources)
                .reduce((a, b) => a.concat(b), [])
            })
          }
        })
        .catch(() => setError("Failed to retrieve dispensing history for prescription."))
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

interface HistoryResponse {
  prescription_order: Bundle,
  dispense_notifications: Array<Bundle>
}

export default ClaimPage

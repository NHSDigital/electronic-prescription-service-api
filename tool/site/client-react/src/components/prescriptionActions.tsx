import {ActionLink} from "nhsuk-react-components"
import * as React from "react"
import {useContext} from "react"
import {AppContext} from "../index"

interface PrescriptionActionsProps {
  prescriptionId: string
  cancel?: boolean
  release?: boolean
  dispense?: boolean
  claim?: boolean
  view?: boolean
}

const PrescriptionActions: React.FC<PrescriptionActionsProps> = ({
  prescriptionId,
  cancel,
  release,
  dispense,
  claim,
  view
}) => {
  const {baseUrl} = useContext(AppContext)
  return (
    <>
      {cancel && (
        <ActionLink target="_blank" href={`${baseUrl}prescribe/cancel?prescription_id=${prescriptionId}`}>
          Cancel prescription
        </ActionLink>
      )}
      {release && (
        <ActionLink href={`${baseUrl}dispense/release?prescription_id=${prescriptionId}`}>
          Release prescription
        </ActionLink>
      )}
      {dispense && (
        <ActionLink href={`${baseUrl}dispense/dispense?prescription_id=${prescriptionId}`}>
          Dispense prescription
        </ActionLink>
      )}
      {claim && (
        <ActionLink href={`${baseUrl}dispense/claim?prescription_id=${prescriptionId}`}>
          Claim for prescription
        </ActionLink>
      )}
      {view && (
        <ActionLink href={`${baseUrl}search?prescription_id=${prescriptionId}`}>
          View prescription
        </ActionLink>
      )}
    </>
  )
}

export default PrescriptionActions

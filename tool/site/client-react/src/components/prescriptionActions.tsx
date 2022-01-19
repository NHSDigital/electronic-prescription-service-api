import {ActionLink} from "nhsuk-react-components"
import * as React from "react"
import {useContext} from "react"
import {AppContext} from "../index"

interface PrescriptionActionsProps {
  prescriptionId: string
  cancel?: boolean
  release?: boolean
  returnRelease?: boolean
  dispense?: boolean
  claim?: boolean
  view?: boolean
}

const PrescriptionActions: React.FC<PrescriptionActionsProps> = ({
  prescriptionId,
  cancel,
  release,
  returnRelease,
  dispense,
  claim,
  view
}) => {
  const {baseUrl} = useContext(AppContext)
  return (
    <>
      {cancel && (
        <ActionLink href={`${baseUrl}prescribe/cancel?prescription_id=${prescriptionId}`}>
          Cancel medication
        </ActionLink>
      )}
      {release && (
        <ActionLink href={`${baseUrl}dispense/release?prescription_id=${prescriptionId}`}>
          Release prescription
        </ActionLink>
      )}
      {returnRelease && (
        <ActionLink href={`${baseUrl}dispense/return?prescription_id=${prescriptionId}`}>
          Return prescription
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

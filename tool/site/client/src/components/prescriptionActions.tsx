import {ActionLink} from "nhsuk-react-components"
import * as React from "react"
import {useContext} from "react"
import {AppContext} from "../index"

interface PrescriptionActionsProps {
  prescriptionId: string
  cancel?: boolean
  release?: boolean
  verify?: boolean
  releaseReturn?: boolean
  dispense?: boolean
  withdraw?: boolean
  claim?: boolean
  view?: boolean
}

const PrescriptionActions: React.FC<PrescriptionActionsProps> = ({
  prescriptionId,
  cancel,
  release,
  verify,
  releaseReturn,
  withdraw,
  dispense,
  claim,
  view
}) => {
  const {baseUrl} = useContext(AppContext)
  return (
    <>
      {cancel && (
        <ActionLink href={`${baseUrl}prescribe/cancel?prescription_id=${encodeURIComponent(prescriptionId)}`}>
          Cancel prescription
        </ActionLink>
      )}
      {release && (
        <ActionLink href={`${baseUrl}dispense/release?prescription_id=${encodeURIComponent(prescriptionId)}`}>
          Release prescription
        </ActionLink>
      )}
      {verify && (
        <ActionLink href={`${baseUrl}dispense/verify?prescription_id=${encodeURIComponent(prescriptionId)}`}>
          Verify prescription
        </ActionLink>
      )}
      {releaseReturn && (
        <ActionLink href={`${baseUrl}dispense/return?prescription_id=${encodeURIComponent(prescriptionId)}`}>
          Return prescription
        </ActionLink>
      )}
      {dispense && (
        <ActionLink href={`${baseUrl}dispense/dispense?prescription_id=${encodeURIComponent(prescriptionId)}`}>
          Dispense prescription
        </ActionLink>
      )}
      {withdraw && (
        <ActionLink href={`${baseUrl}dispense/withdraw?prescription_id=${encodeURIComponent(prescriptionId)}`}>
          Withdraw prescription
        </ActionLink>
      )}
      {claim && (
        <ActionLink href={`${baseUrl}dispense/claim?prescription_id=${encodeURIComponent(prescriptionId)}`}>
          Claim for prescription
        </ActionLink>
      )}
      {view && (
        <ActionLink href={`${baseUrl}search?prescription_id=${encodeURIComponent(prescriptionId)}`}>
          View prescription
        </ActionLink>
      )}
    </>
  )
}

export default PrescriptionActions

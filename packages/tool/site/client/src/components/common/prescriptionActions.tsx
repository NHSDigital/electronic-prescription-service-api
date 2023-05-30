import {ActionLink} from "nhsuk-react-components"
import React, {useContext} from "react"
import {AppContext} from "../../index"

export interface PrescriptionActionsProps extends Actions {
  prescriptionId: string
}

export interface Actions {
  cancel?: boolean
  release?: boolean
  releaseReturn?: boolean
  dispense?: boolean
  withdraw?: boolean
  claim?: boolean
  claimAmend?: boolean
  statusView?: boolean
  summaryView?: boolean
}

const PrescriptionActions: React.FC<PrescriptionActionsProps> = ({prescriptionId, ...actions}) => {
  const {baseUrl} = useContext(AppContext)
  return (
    <>
      {actions.cancel && (
        <ActionLink href={`${baseUrl}prescribe/cancel?prescription_id=${encodeURIComponent(prescriptionId)}`}>
          Cancel prescription
        </ActionLink>
      )}
      {actions.release && (
        <ActionLink href={`${baseUrl}dispense/release?prescription_id=${encodeURIComponent(prescriptionId)}`}>
          Release prescription
        </ActionLink>
      )}
      {actions.releaseReturn && (
        <ActionLink href={`${baseUrl}dispense/return?prescription_id=${encodeURIComponent(prescriptionId)}`}>
          Return prescription
        </ActionLink>
      )}
      {actions.dispense && (
        <ActionLink href={`${baseUrl}dispense/dispense?prescription_id=${encodeURIComponent(prescriptionId)}`}>
          Dispense prescription
        </ActionLink>
      )}
      {actions.withdraw && (
        <ActionLink href={`${baseUrl}dispense/withdraw?prescription_id=${encodeURIComponent(prescriptionId)}`}>
          Withdraw prescription
        </ActionLink>
      )}
      {actions.claim && (
        <ActionLink href={`${baseUrl}dispense/claim?prescription_id=${encodeURIComponent(prescriptionId)}`}>
          Claim for prescription
        </ActionLink>
      )}
      {actions.claimAmend && (
        <ActionLink href={`${baseUrl}dispense/claim?prescription_id=${encodeURIComponent(prescriptionId)}&amend=true`}>
          Amend the claim on this prescription
        </ActionLink>
      )}
      {actions.statusView && (
        <ActionLink href={`${baseUrl}view?prescription_id=${encodeURIComponent(prescriptionId)}`}>
          Check prescription status
        </ActionLink>
      )}
    </>
  )
}

export default PrescriptionActions

import {ActionLink} from "nhsuk-react-components"
import * as React from "react"
import {useContext} from "react"
import {AppContext} from "../index"

interface PrescriptionActionsProps {
  prescriptionId: string
  cancel?: boolean
  release?: boolean
  releaseReturn?: boolean
  withdraw?: boolean
  dispense?: boolean
  claim?: boolean
  view?: boolean
}

const PrescriptionActions: React.FC<PrescriptionActionsProps> = ({
  prescriptionId,
  cancel,
  release,
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
        <ActionLink href={encodeURI(`${baseUrl}prescribe/cancel?prescription_id=${prescriptionId}`)}>
          Cancel prescription
        </ActionLink>
      )}
      {release && (
        <ActionLink href={encodeURI(`${baseUrl}dispense/release?prescription_id=${prescriptionId}`)}>
          Release prescription
        </ActionLink>
      )}
      {releaseReturn && (
        <ActionLink href={encodeURI(`${baseUrl}dispense/return?prescription_id=${prescriptionId}`)}>
          Return prescription
        </ActionLink>
      )}
      {dispense && (
        <ActionLink href={encodeURI(`${baseUrl}dispense/dispense?prescription_id=${prescriptionId}`)}>
          Dispense prescription
        </ActionLink>
      )}
      {withdraw && (
        <ActionLink href={encodeURI(`${baseUrl}dispense/withdraw?prescription_id=${prescriptionId}`)}>
          Withdraw prescription
        </ActionLink>
      )}
      {claim && (
        <ActionLink href={encodeURI(`${baseUrl}dispense/claim?prescription_id=${prescriptionId}`)}>
          Claim for prescription
        </ActionLink>
      )}
      {view && (
        <ActionLink href={encodeURI(`${baseUrl}search?prescription_id=${prescriptionId}`)}>
          View prescription
        </ActionLink>
      )}
    </>
  )
}

export default PrescriptionActions

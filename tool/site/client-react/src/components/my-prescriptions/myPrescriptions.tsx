import React from "react"
import {PrescriptionGroupTable} from "./prescriptionGroupTable"

export interface Prescriptions {
  sentPrescriptions: Array<PrescriptionSummary>
  releasedPrescriptions: Array<PrescriptionSummary>
}

interface PrescriptionSummary {
  id: string
}

export const MyPrescriptions : React.FC<Prescriptions> = (
  prescriptions
) => {
  return (
    <>
      <PrescriptionGroupTable
        name="Sent Prescriptions"
        description="Prescriptions ready to release"
        prescriptions={prescriptions.sentPrescriptions}
        actions={{ view: true, release: true }}
      />
      <PrescriptionGroupTable
        name="Released Prescriptions"
        description="Prescriptions ready to dispense"
        prescriptions={prescriptions.releasedPrescriptions}
        actions={{ view: true, releaseReturn: true, dispense: true }}
      />
    </>
  )
}

export default MyPrescriptions

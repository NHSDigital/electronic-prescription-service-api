import React from "react"
import {PrescriptionGroupTable} from "./prescriptionGroupTable"

export interface Prescriptions {
  sentPrescriptions: Array<string>
  releasedPrescriptions: Array<string>
  dispensedPrescriptions: Array<string>
  claimedPrescriptions: Array<string>
}

export const MyPrescriptions : React.FC<Prescriptions> = prescriptions => {
  return (
    <>
      <PrescriptionGroupTable
        name="Sent Prescriptions"
        description="Prescriptions created and sent"
        prescriptions={prescriptions.sentPrescriptions}
        actions={{statusView: true, release: true, summaryView: true}}
      />
      <PrescriptionGroupTable
        name="Released Prescriptions"
        description="Prescriptions which have been downloaded"
        prescriptions={prescriptions.releasedPrescriptions}
        actions={{statusView: true, releaseReturn: true, dispense: true, summaryView: true}}
      />
      <PrescriptionGroupTable
        name="Dispensed Prescriptions"
        description="Partially and fully dispensed prescriptions"
        prescriptions={prescriptions.dispensedPrescriptions}
        actions={{statusView: true, dispense: true, withdraw: true, claim: true, summaryView: true}}
      />
      <PrescriptionGroupTable
        name="Claimed Prescriptions"
        description="Prescriptions which have been claimed for"
        prescriptions={prescriptions.claimedPrescriptions}
        actions={{statusView: true, claimAmend: true, summaryView: true}}
      />
    </>
  )
}

export default MyPrescriptions

import * as fhir from "fhir/r4"
import {Button} from "nhsuk-react-components"
import React from "react"

import ButtonList from "../common/buttonList"
import * as utils from "./fragments/utils"
import {
  EditPrescriptionProps,
  PrescriptionSummaryViewLabel,
  PrescriptionSummary,
  PrescriptionSummaryProps,
  PrescriptionLevelDetails,
  PrescriptionLevelDetailsProps
} from "./fragments"

interface PrescriptionSummaryViewProps {
  prescriptionSummary: PrescriptionSummaryProps
  prescriptionLevelDetails: PrescriptionLevelDetailsProps
  handleDownload?: () => Promise<void>
  editorProps?: EditPrescriptionProps
}

const PrescriptionSummaryView = ({
  prescriptionSummary,
  prescriptionLevelDetails,
  handleDownload,
  editorProps
}: PrescriptionSummaryViewProps) => {
  return (
    <>
      <PrescriptionSummaryViewLabel editorProps={editorProps} />

      {handleDownload &&
        <ButtonList>
          <Button onClick={() => handleDownload()} type={"button"}>Download this Prescription</Button>
        </ButtonList>
      }

      <PrescriptionLevelDetails {...prescriptionLevelDetails} editMode={editorProps?.editMode} />
      <PrescriptionSummary {...prescriptionSummary} />
    </>
  )
}

const createPrescriptionSummaryViewProps = (bundle: fhir.Bundle) => {
  const prescription = parsePrescriptionBundle(bundle)
  const medicationRequests = prescription.medicationRequests
  const prescriptionSummary = utils.createPrescriptionSummary(bundle, medicationRequests)
  const prescriptionLevelDetails = utils.createPrescriptionLevelDetails(
    bundle,
    medicationRequests[0]
  )

  return {
    prescriptionSummary,
    prescriptionLevelDetails
  }
}

const parsePrescriptionBundle = (bundle: fhir.Bundle) => {
  const resources = bundle.entry.map(e => e.resource)
  const medicationRequests = resources.filter(r => r.resourceType === "MedicationRequest") as Array<fhir.MedicationRequest>
  const communicationRequests = resources.filter(r => r.resourceType === "CommunicationRequest") as Array<fhir.CommunicationRequest>

  const medicationRequest = medicationRequests[0]
  const patient: fhir.Patient = resolveReference(bundle, medicationRequest.subject)
  const requesterPractitionerRole: fhir.PractitionerRole = resolveReference(bundle, medicationRequest.requester)

  return {
    patient,
    requesterPractitionerRole,
    medicationRequests,
    communicationRequests
  }
}

function resolveReference<T extends fhir.FhirResource>(bundle: fhir.Bundle, reference: fhir.Reference) {
  return bundle.entry.find(e => e.fullUrl === reference?.reference)?.resource as T
}

export {
  PrescriptionSummaryView,
  PrescriptionSummaryViewProps,
  createPrescriptionSummaryViewProps
}

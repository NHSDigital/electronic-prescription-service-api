import * as fhir from "fhir/r4"
import {Button, Label} from "nhsuk-react-components"
import React from "react"

import ButtonList from "../common/buttonList"
import Pagination from "../pagination"

import {PrescriptionLevelDetails, createPrescriptionLevelDetails} from "./PrescriptionLevelDetails"
import {createPrescriptionSummary, PrescriptionSummary} from "./PrescriptionSummary"

import { } from "./utils"

interface PrescriptionSummaryViewProps {
  prescriptionBundle: fhir.Bundle
  currentPage: number
  pageCount: number
  onPageChange: (page: number) => void
  handleDownload?: () => Promise<void>
}

interface PrescriptionSummaryErrors {
  numberOfCopies?: string
}

const PrescriptionSummaryView = ({
  prescriptionBundle,
  currentPage,
  pageCount,
  onPageChange,
  handleDownload
}: PrescriptionSummaryViewProps) => {
  const prescription = parsePrescriptionBundle(prescriptionBundle)
  const medicationRequests = prescription.medicationRequests
  const prescriptionSummary = createPrescriptionSummary(prescriptionBundle, medicationRequests)
  const prescriptionLevelDetails = createPrescriptionLevelDetails(
    prescriptionBundle,
    medicationRequests[0]
  )

  return (
    <>
      <Label isPageHeading>
        <span>Prescription Summary</span>
      </Label>

      <Pagination
        currentPage={currentPage}
        totalCount={pageCount}
        pageSize={1}
        onPageChange={onPageChange} />

      {handleDownload && <ButtonList>
        <Button onClick={() => handleDownload()} type={"button"}>Download this Prescription</Button>
      </ButtonList>}

      <PrescriptionLevelDetails {...prescriptionLevelDetails} editMode={false} />
      <PrescriptionSummary {...prescriptionSummary} />

      <Pagination
        currentPage={currentPage}
        totalCount={pageCount}
        pageSize={1}
        onPageChange={onPageChange} />
    </>
  )
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
  PrescriptionSummaryErrors
}

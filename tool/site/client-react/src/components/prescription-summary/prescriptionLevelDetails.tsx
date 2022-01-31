import {SummaryList} from "nhsuk-react-components"
import React, {FC} from "react"
import {CommunicationRequest, CommunicationRequestPayload, MedicationRequest} from "fhir/r4"
import {formatCurrentDate, formatDate} from "../../formatters/dates"
import {getPerformerSiteTypeExtension} from "../../fhir/customExtensions"
import {newLineFormatter} from "./newLineFormatter"
import {COURSE_OF_THERAPY_TYPE_CODES, VALUE_SET_COURSE_OF_THERAPY_TYPE} from "../../fhir/reference-data/valueSets"
import {getRepeatsIssuedAndAllowed} from "../../fhir/helpers"

export function createPrescriptionLevelDetails(medicationRequest: MedicationRequest, communicationRequests?: Array<CommunicationRequest>): PrescriptionLevelDetailsProps {
  const prescriptionId = medicationRequest.groupIdentifier.value

  const courseOfTherapyTypeCoding = VALUE_SET_COURSE_OF_THERAPY_TYPE.find(coding => coding.code === medicationRequest.courseOfTherapyType.coding[0].code)

  const authoredOn = formatCurrentDate()
  const startDate = formatDate(medicationRequest.dispenseRequest.validityPeriod?.start) ?? authoredOn
  const nominatedOds = medicationRequest.dispenseRequest?.performer?.identifier?.value || ""

  const nominatedTypeExtension = getPerformerSiteTypeExtension(medicationRequest.dispenseRequest.extension)
  const nominatedTypeCode = nominatedTypeExtension.valueCoding.code
  const nominatedType = getPharmacyTypeText(nominatedTypeCode)

  const patientInstructions = communicationRequests
    .flatMap(communicationRequest => communicationRequest.payload)
    .filter(Boolean)
    .filter(isContentStringPayload)
    .map(payload => payload.contentString)

  const detailsProps: PrescriptionLevelDetailsProps = {
    prescriptionId,
    courseOfTherapyType: courseOfTherapyTypeCoding.display,
    authoredOn,
    startDate,
    nominatedOds,
    nominatedType,
    patientInstructions
  }

  if (courseOfTherapyTypeCoding.code !== COURSE_OF_THERAPY_TYPE_CODES.ACUTE) {
    const [repeatsIssued, repeatsAllowed] = getRepeatsIssuedAndAllowed(medicationRequest)
    detailsProps.repeatsIssued = repeatsIssued
    detailsProps.repeatsAllowed = repeatsAllowed
  }

  return detailsProps
}

export interface PrescriptionLevelDetailsProps {
  prescriptionId: string
  courseOfTherapyType: string
  repeatsIssued?: number
  repeatsAllowed?: number
  authoredOn: string
  startDate: string
  nominatedOds?: string
  nominatedType?: string
  patientInstructions?: Array<string>
}

const PrescriptionLevelDetails: FC<PrescriptionLevelDetailsProps> = ({
  prescriptionId,
  courseOfTherapyType,
  repeatsIssued,
  repeatsAllowed,
  authoredOn,
  startDate,
  nominatedOds,
  nominatedType,
  patientInstructions
}) => {
  const patientInstruction = newLineFormatter(patientInstructions)
  return (
    <SummaryList>
      <SummaryList.Row>
        <SummaryList.Key>ID</SummaryList.Key>
        <SummaryList.Value>{prescriptionId}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Course Of Therapy</SummaryList.Key>
        <SummaryList.Value>{courseOfTherapyType}</SummaryList.Value>
      </SummaryList.Row>
      {repeatsIssued &&
      <SummaryList.Row>
        <SummaryList.Key>Issue Number</SummaryList.Key>
        <SummaryList.Value>{repeatsIssued} of {repeatsAllowed}</SummaryList.Value>
      </SummaryList.Row>
      }
      <SummaryList.Row>
        <SummaryList.Key>Authored On</SummaryList.Key>
        <SummaryList.Value>{authoredOn}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Effective Date</SummaryList.Key>
        <SummaryList.Value>{startDate}</SummaryList.Value>
      </SummaryList.Row>
      {nominatedOds &&
      <>
        <SummaryList.Row>
          <SummaryList.Key>Nominated Pharmacy ODS Code</SummaryList.Key>
          <SummaryList.Value>{nominatedOds}</SummaryList.Value>
        </SummaryList.Row>
        <SummaryList.Row>
          <SummaryList.Key>Nominated Pharmacy Type</SummaryList.Key>
          <SummaryList.Value>{nominatedType}</SummaryList.Value>
        </SummaryList.Row>
      </>
      }
      {patientInstructions.length > 0 &&
      <SummaryList.Row>
        <SummaryList.Key>Patient Instructions</SummaryList.Key>
        <SummaryList.Value>{patientInstruction}</SummaryList.Value>
      </SummaryList.Row>
      }
    </SummaryList>
  )
}

function getPharmacyTypeText(code: string): string {
  if (code === "P1") {
    return "Other (e.g. Community Pharmacy)"
  } else if (code === "P2") {
    return "Appliance Contractor"
  } else if (code === "P3") {
    return "Dispensing Doctor"
  } else if (code === "0004") {
    return "None"
  } else {
    return ""
  }
}

function isContentStringPayload(payload: CommunicationRequestPayload): boolean {
  return !!payload.contentString
}

export default PrescriptionLevelDetails

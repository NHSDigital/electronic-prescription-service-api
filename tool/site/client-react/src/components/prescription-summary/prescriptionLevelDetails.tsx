import {SummaryList} from "nhsuk-react-components"
import * as React from "react"
import {Coding, CommunicationRequest, CommunicationRequestPayload, MedicationRequest} from "fhir/r4"
import {formatCurrentDate, formatDate} from "../../formatters/dates"
import {
  getNumberOfRepeatsAllowedExtension,
  getNumberOfRepeatsIssuedExtension,
  getPerformerSiteTypeExtension,
  getRepeatInformationExtension
} from "../../fhir/customExtensions"
import {newLineFormatter} from "./newLineFormatter"
import * as fhir from "fhir/r4"
import {COURSE_OF_THERAPY_TYPE_CODES, VALUE_SET_COURSE_OF_THERAPY_TYPE} from "./reference-data/valueSets"
import {FC} from "react"

export function createPrescriptionLevelDetails(medicationRequest: MedicationRequest, communicationRequests?: Array<CommunicationRequest>): PrescriptionLevelDetailsProps {
  const prescriptionId = medicationRequest.groupIdentifier.value

  const courseOfTherapyTypeCoding = VALUE_SET_COURSE_OF_THERAPY_TYPE.find(coding => coding.code === medicationRequest.courseOfTherapyType.coding[0].code)

  const repeatExtension = getRepeatInformationExtension(medicationRequest.extension)
  let repeatIssued = 1
  let repeatAllowed = medicationRequest.dispenseRequest.numberOfRepeatsAllowed ? medicationRequest.dispenseRequest.numberOfRepeatsAllowed + 1 : 1
  if (repeatExtension) {
    const repeatsIssuedExtension = getNumberOfRepeatsIssuedExtension(repeatExtension.extension)
    repeatIssued = repeatsIssuedExtension.valueInteger
    const repeatsAllowedExtension = getNumberOfRepeatsAllowedExtension(repeatExtension.extension)
    if (repeatsAllowedExtension) {
      repeatAllowed = repeatsAllowedExtension.valueInteger
    }
  }

  const authoredOn = formatCurrentDate()
  const startDate = formatDate(medicationRequest.dispenseRequest.validityPeriod?.start) ?? formatCurrentDate()
  const nominatedOds = medicationRequest.dispenseRequest?.performer?.identifier?.value || ""

  const nominatedTypeExtension = getPerformerSiteTypeExtension(medicationRequest.dispenseRequest.extension)
  const nominatedTypeCode = nominatedTypeExtension.valueCoding.code
  const nominatedType = getPharmacyTypeText(nominatedTypeCode)

  const patientInstructions = communicationRequests
    .flatMap(communicationRequest => communicationRequest.payload)
    .filter(Boolean)
    .filter(isContentStringPayload)
    .map(payload => payload.contentString)

  return {
    prescriptionId,
    courseOfTherapyTypeCoding,
    repeatIssued,
    repeatAllowed,
    authoredOn,
    startDate,
    nominatedOds,
    nominatedType,
    patientInstructions
  }
}

export interface PrescriptionLevelDetailsProps {
  prescriptionId: string
  courseOfTherapyTypeCoding: Coding
  repeatIssued?: number
  repeatAllowed?: number
  authoredOn: string
  startDate: string
  nominatedOds?: string
  nominatedType?: string
  patientInstructions?: Array<string>
}

const PrescriptionLevelDetails: FC<PrescriptionLevelDetailsProps> = ({
  prescriptionId,
  courseOfTherapyTypeCoding,
  repeatIssued,
  repeatAllowed,
  authoredOn,
  startDate,
  nominatedOds,
  nominatedType,
  patientInstructions
}): JSX.Element => {
  const patientInstruction = newLineFormatter(patientInstructions)
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <SummaryList>
      <SummaryList.Row>
        <SummaryList.Key>ID</SummaryList.Key>
        <SummaryList.Value>{prescriptionId}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Course Of Therapy Type</SummaryList.Key>
        <SummaryList.Value>{courseOfTherapyTypeCoding.display}</SummaryList.Value>
      </SummaryList.Row>
      {courseOfTherapyTypeCoding.code !== COURSE_OF_THERAPY_TYPE_CODES.acute &&
          <SummaryList.Row>
            <SummaryList.Key>Repeat Information</SummaryList.Key>
            <SummaryList.Value>{repeatIssued} out of {repeatAllowed}</SummaryList.Value>
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
      {patientInstruction &&
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

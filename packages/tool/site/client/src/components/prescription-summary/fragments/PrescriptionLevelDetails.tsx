import {Bundle, CommunicationRequest, CommunicationRequestPayload, MedicationRequest} from "fhir/r4"
import {Field} from "formik"
import {TextInput, SummaryList} from "nhsuk-react-components"
import React from "react"
import {getPerformerSiteTypeExtension} from "../../../fhir/customExtensions"
import {getCurrentIssueNumberAndEndIssueNumber} from "../../../fhir/helpers"
import {COURSE_OF_THERAPY_TYPE_CODES, VALUE_SET_COURSE_OF_THERAPY_TYPE} from "../../../fhir/reference-data/valueSets"
import {formatCurrentDate, formatDate} from "../../../formatters/dates"
import {newLineFormatter} from "../../common/newLineFormatter"

function createPrescriptionLevelDetails(
  bundle: Bundle,
  medicationRequest: MedicationRequest
): PrescriptionLevelDetailsProps {
  const resources = bundle.entry.map(e => e.resource)
  const communicationRequests = resources.filter(r => r.resourceType === "CommunicationRequest") as Array<CommunicationRequest>

  const prescriptionId = medicationRequest.groupIdentifier.value

  const courseOfTherapyTypeCoding = VALUE_SET_COURSE_OF_THERAPY_TYPE.find(coding => coding.code === medicationRequest.courseOfTherapyType.coding[0].code)

  const authoredOn = formatCurrentDate()
  const startDate = formatDate(medicationRequest.dispenseRequest.validityPeriod?.start) ?? authoredOn
  const nominatedOds = medicationRequest.dispenseRequest?.performer?.identifier?.value || "None"

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
    prescriptionTypeCode:
      medicationRequest.extension?.find(
        e => e.url === "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType"
      )?.valueCoding.code,
    authoredOn,
    startDate,
    nominatedOds,
    nominatedType,
    patientInstructions
  }

  if (courseOfTherapyTypeCoding.code !== COURSE_OF_THERAPY_TYPE_CODES.ACUTE) {
    const [currentIssueNumber, endIssueNumber] = getCurrentIssueNumberAndEndIssueNumber(medicationRequest)
    detailsProps.currentIssueNumber = currentIssueNumber
    detailsProps.endIssueNumber = endIssueNumber
  }

  return detailsProps
}

interface PrescriptionLevelDetailsProps {
  prescriptionId: string
  courseOfTherapyType: string
  prescriptionTypeCode: string
  currentIssueNumber?: number
  endIssueNumber?: number
  authoredOn: string
  startDate: string
  nominatedOds?: string
  nominatedType?: string
  patientInstructions?: Array<string>
  editMode?: boolean
}

const SummaryListRow = ({label, value}: { label: string, value: string | JSX.Element | JSX.Element[] }) => {
  return (
    <SummaryList.Row>
      <SummaryList.Key>{label}</SummaryList.Key>
      <SummaryList.Value>{value}</SummaryList.Value>
    </SummaryList.Row>
  )
}

const PrescriptionLevelDetails = ({
  prescriptionId,
  courseOfTherapyType,
  prescriptionTypeCode,
  currentIssueNumber,
  endIssueNumber,
  authoredOn,
  startDate,
  nominatedOds,
  nominatedType,
  patientInstructions,
  editMode
}: PrescriptionLevelDetailsProps) => {
  const patientInstruction = newLineFormatter(patientInstructions)

  return (
    <SummaryList>
      <SummaryListRow label="ID" value={prescriptionId} />
      <SummaryListRow label="Prescription Type Code" value={prescriptionTypeCode} />
      <SummaryListRow label="Course Of Therapy" value={courseOfTherapyType} />

      {currentIssueNumber ?
        <SummaryListRow label="Issue Number" value={`${currentIssueNumber} of ${endIssueNumber}`} />
        : null
      }

      <SummaryListRow label="Authored On" value={authoredOn} />
      <SummaryListRow label="Effective Date" value={startDate} />

      {nominatedOds &&
        <>
          <SummaryListRow label="Nominated Pharmacy ODS Code" value={
            editMode
              ? <Field id="nominatedOds" name="nominatedOds" as={TextInput} width={30} />
              : nominatedOds
          } />

          <SummaryListRow label="Nominated Pharmacy Type" value={nominatedType} />
        </>
      }

      {patientInstructions.length > 0 &&
        <SummaryListRow label="Patient Instructions" value={patientInstruction} />
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

export {
  PrescriptionLevelDetails,
  PrescriptionLevelDetailsProps,
  createPrescriptionLevelDetails
}

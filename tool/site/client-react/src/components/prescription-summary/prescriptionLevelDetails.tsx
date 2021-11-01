import {SummaryList} from "nhsuk-react-components"
import * as React from "react"
import {CommunicationRequest, CommunicationRequestPayload, MedicationRequest} from "fhir/r4"
import {formatDate} from "../../formatters/dates"
import {
  getNumberOfRepeatsAllowedExtension,
  getNumberOfRepeatsIssuedExtension, getPerformerSiteTypeExtension,
  getRepeatInformationExtension
} from "../../fhir/customExtensions"

export function createPrescriptionLevelDetails(medicationRequest: MedicationRequest, communicationRequests?: Array<CommunicationRequest>): PrescriptionLevelDetailsProps {
  const prescriptionId = medicationRequest.groupIdentifier.value

  const repeatExtension = getRepeatInformationExtension(medicationRequest.extension)
  const repeatsIssuedExtension = getNumberOfRepeatsIssuedExtension(repeatExtension.extension)
  const repeatIssued = repeatsIssuedExtension.valueInteger
  const repeatsAllowedExtension = getNumberOfRepeatsAllowedExtension(repeatExtension.extension)
  const repeatAllowed = repeatsAllowedExtension.valueInteger

  const authoredOn = formatDate()
  const startDate = medicationRequest.dispenseRequest.validityPeriod?.start ?? new Date().toISOString().slice(0, 10)
  const nominatedOds = medicationRequest.dispenseRequest?.performer?.identifier?.value || ""

  const nominatedTypeExtension = getPerformerSiteTypeExtension(medicationRequest.dispenseRequest.extension)
  const nominatedTypeCode = nominatedTypeExtension.valueCoding.code
  const nominatedType = getPharmacyTypeText(nominatedTypeCode)

  const patientInstruction = communicationRequests
    .flatMap(communicationRequest => communicationRequest.payload)
    .filter(Boolean)
    .filter(isContentStringPayload)
    .map(payload => payload.contentString)
    .join("\n")

  return {
    prescriptionId,
    repeatIssued,
    repeatAllowed,
    authoredOn,
    startDate,
    nominatedOds,
    nominatedType,
    patientInstruction
  }
}

export interface PrescriptionLevelDetailsProps {
  prescriptionId: string
  repeatIssued?: number
  repeatAllowed?: number
  authoredOn: string
  startDate: string
  nominatedOds?: string
  nominatedType?: string
  patientInstruction?: string
}

const PrescriptionLevelDetails = ({
  prescriptionId,
  repeatIssued,
  repeatAllowed,
  authoredOn,
  startDate,
  nominatedOds,
  nominatedType,
  patientInstruction
}: PrescriptionLevelDetailsProps): JSX.Element => {

  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <SummaryList>
      <SummaryList.Row>
        <SummaryList.Key>ID</SummaryList.Key>
        <SummaryList.Value>{prescriptionId}</SummaryList.Value>
      </SummaryList.Row>
      {repeatAllowed > 1 &&
        <>
          <SummaryList.Row>
            <SummaryList.Key>Repeat Information</SummaryList.Key>
            <SummaryList.Value>{repeatIssued}/{repeatAllowed}</SummaryList.Value>
          </SummaryList.Row>
        </>
      }
      <SummaryList.Row>
        <SummaryList.Key>Authored on</SummaryList.Key>
        <SummaryList.Value>{authoredOn}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Effective date</SummaryList.Key>
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
      <>
        <SummaryList.Row>
          <SummaryList.Key>Patient Instructions</SummaryList.Key>
          <SummaryList.Value>{patientInstruction}</SummaryList.Value>
        </SummaryList.Row>
      </>
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

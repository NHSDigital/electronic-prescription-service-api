import {SummaryList} from "nhsuk-react-components"
import * as React from "react"
import {CommunicationRequest, CommunicationRequestPayload, MedicationRequest} from "fhir/r4"

export function createPrescriptionLevelDetails(medicationRequest: MedicationRequest, communicationRequests?: Array<CommunicationRequest>): PrescriptionLevelDetailsProps {
  const prescriptionId = medicationRequest.groupIdentifier.value
  //TODO - repeatNumber
  const repeatNumber = null
  const authoredOn = getFormattedDate()
  const startDate = medicationRequest.dispenseRequest.validityPeriod?.start ?? new Date().toISOString().slice(0, 10)
  const nominatedOds = medicationRequest.dispenseRequest?.performer?.identifier?.value || ""
  const nominatedType = getPharmacyType(medicationRequest)
  const patientInstruction = communicationRequests
    .flatMap(communicationRequest => communicationRequest.payload)
    .filter(Boolean)
    .filter(isContentStringPayload)
    .map(payload => payload.contentString)
    .join("\n")

  return {
    prescriptionId,
    repeatNumber,
    authoredOn,
    startDate,
    nominatedOds,
    nominatedType,
    patientInstruction
  }
}

export interface PrescriptionLevelDetailsProps {
  prescriptionId: string
  repeatNumber?: string
  authoredOn: string
  startDate: string
  nominatedOds?: string
  nominatedType?: string
  patientInstruction?: string
}

const PrescriptionLevelDetails = ({
  prescriptionId,
  repeatNumber,
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
      {repeatNumber &&
        <>
          <SummaryList.Row>
            <SummaryList.Key>Repeat Number</SummaryList.Key>
            <SummaryList.Value>{repeatNumber}</SummaryList.Value>
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

function getFormattedDate() {
  const date = new Date()
  const year = date.getFullYear()
  const month = ("0" + (date.getMonth() + 1)).slice(-2)
  const day = date.getDate()
  return `${year}-${month}-${day}`
}

function getPharmacyType(medicationRequest: MedicationRequest): string {
  if (medicationRequest) {
    const extension = medicationRequest.dispenseRequest.extension?.filter(
      extension => extension.url === "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PerformerSiteType"
    )[0] as CodingExtension
    const code = extension?.valueCoding?.code

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
}

function isContentStringPayload(payload: CommunicationRequestPayload): boolean {
  return !!payload.contentString
}

export default PrescriptionLevelDetails

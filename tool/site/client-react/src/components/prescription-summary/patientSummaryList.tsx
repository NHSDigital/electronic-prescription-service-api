import {SummaryList} from "nhsuk-react-components"
import * as React from "react"
import {Fragment} from "react"
import {Patient} from "fhir/r4"
import {formatGender, formatName, formatNhsNumber, getAllAddressLines} from "../../formatters/demographics"
import {formatDate} from "../../formatters/dates"

export function createPatientSummaryListProps(patient: Patient): PatientSummaryListProps {
  return {
    name: formatName(patient.name[0]),
    nhsNumber: formatNhsNumber(patient.identifier.find(identifier => identifier.system === "https://fhir.nhs.uk/Id/nhs-number").value),
    dateOfBirth: formatDate(patient.birthDate),
    gender: formatGender(patient.gender),
    addressLines: getAllAddressLines(patient.address[0])
  }
}

export interface PatientSummaryListProps {
  name: string
  nhsNumber: string
  dateOfBirth: string
  gender: string
  addressLines: Array<string>
}

export const PatientSummaryList = ({
  name,
  nhsNumber,
  dateOfBirth,
  gender,
  addressLines
}: PatientSummaryListProps): JSX.Element => {
  const addressLineFragments = addressLines.map((addressLine, index) => (
    <Fragment key={index}>
      {index > 0 && <br/>}
      {addressLine}
    </Fragment>
  ))
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <SummaryList>
      <SummaryList.Row>
        <SummaryList.Key>Name</SummaryList.Key>
        <SummaryList.Value>{name}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>NHS Number</SummaryList.Key>
        <SummaryList.Value>{nhsNumber}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Date of Birth</SummaryList.Key>
        <SummaryList.Value>{dateOfBirth}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Gender</SummaryList.Key>
        <SummaryList.Value>{gender}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Address</SummaryList.Key>
        <SummaryList.Value>{addressLineFragments}</SummaryList.Value>
      </SummaryList.Row>
    </SummaryList>
  )
}

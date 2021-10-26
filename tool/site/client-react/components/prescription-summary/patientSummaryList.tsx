import {SummaryList} from "nhsuk-react-components"
import * as React from "react"
import {Patient} from "fhir/r4"
import {NameSummaryListRow} from "./nameSummaryListRow"
import {AddressSummaryListRow} from "./addressSummaryListRow"
import {NhsNumberSummaryListRow} from "./nhsNumberSummaryListRow"
import * as moment from "moment"

interface PatientSummaryListProps {
  patient: Patient
}

export const PatientSummaryList = ({patient}: PatientSummaryListProps): JSX.Element => {
  const name = patient.name[0]
  const nhsNumber = patient.identifier.find(identifier => identifier.system === "https://fhir.nhs.uk/Id/nhs-number").value
  const dateOfBirth = patient.birthDate
  const gender = patient.gender
  const address = patient.address[0]
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <SummaryList>
      <NameSummaryListRow name={name}/>
      <NhsNumberSummaryListRow nhsNumber={nhsNumber}/>
      <SummaryList.Row>
        <SummaryList.Key>Date of birth</SummaryList.Key>
        <SummaryList.Value>{moment.utc(dateOfBirth).format("DD-MMM-YYYY")}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Gender</SummaryList.Key>
        <SummaryList.Value>{gender.substring(0, 1).toUpperCase()}{gender.substring(1)}</SummaryList.Value>
      </SummaryList.Row>
      <AddressSummaryListRow address={address}/>
    </SummaryList>
  )
}

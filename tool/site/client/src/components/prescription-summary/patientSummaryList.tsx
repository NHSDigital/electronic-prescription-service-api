import {Checkboxes, Input, SummaryList} from "nhsuk-react-components"
import * as React from "react"
import {Patient} from "fhir/r4"
import {formatGender, formatName, formatNhsNumber, getAllAddressLines} from "../../formatters/demographics"
import {formatDate} from "../../formatters/dates"
import {newLineFormatter} from "./newLineFormatter"
import {Field} from "formik"

export interface PatientSummaryListProps {
  name: string
  nhsNumber: string
  dateOfBirth: string
  gender: string
  addressLines: Array<string>
  nominatedPharmacy?: string
  editMode: boolean
}

export function createSummaryPatientListProps(patient: Patient, editMode: boolean): PatientSummaryListProps {
  return {
    name: formatName(patient.name[0]),
    nhsNumber: formatNhsNumber(patient.identifier.find(identifier => identifier.system === "https://fhir.nhs.uk/Id/nhs-number").value),
    dateOfBirth: formatDate(patient.birthDate),
    gender: formatGender(patient.gender),
    addressLines: getAllAddressLines(patient.address[0]),
    nominatedPharmacy: patient.extension?.find(e => e.url === "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-NominatedPharmacy")
      ?.valueReference.identifier.value,
    editMode
  }
}

const PatientSummaryList = ({
  name,
  nhsNumber,
  dateOfBirth,
  gender,
  addressLines,
  nominatedPharmacy,
  editMode
}: PatientSummaryListProps): JSX.Element => {
  const addressLineFragments = newLineFormatter(addressLines)
  return (
    editMode
      ? <SummaryList.Row>
        <SummaryList.Key>NHS Number</SummaryList.Key>
        <Field
          id="nhsNumber"
          name="nhsNumber"
          as={Input}
          width={30}
        />
        <Checkboxes id={"nominateToPatientsPharmcy"}>
          <Field id={"nominateToPatientsPharmcy"} name={"nominateToPatientsPharmcy"} type="checkbox" as={Checkboxes.Box}>
            Nominate prescription to patient's pharmacy (if available)
          </Field>
        </Checkboxes>
      </SummaryList.Row>
      : <SummaryList>
        <SummaryList.Row>
          <SummaryList.Key>Name</SummaryList.Key>
          <SummaryList.Value>{name}</SummaryList.Value>
        </SummaryList.Row>
        <SummaryList.Row>
          <SummaryList.Key>NHS Number</SummaryList.Key>
          <SummaryList.Value>{nhsNumber}</SummaryList.Value>
        </SummaryList.Row>
        {nominatedPharmacy &&
          <SummaryList.Row>
            <SummaryList.Key>Nominated Pharmacy</SummaryList.Key>
            <SummaryList.Value>{nominatedPharmacy}</SummaryList.Value>
          </SummaryList.Row>
        }
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

export default PatientSummaryList

import * as XmlJs from "xml-js"
import {getPrescription, resetAll, resetCompare, showDisplay, showError} from "./display"
import {DisplayPrescription, Prescription, PrescriptionLine} from "./models"
import * as diff from "diff"

const prescriptions = new Array<Prescription>()

export async function reset(): Promise<void> {
  resetAll()
  prescriptions.length = 0
}

export async function read(): Promise<void> {
  const prescription =
    await createPrescriptionFromFhir()
    .catch(() => createPrescriptionFromHl7())
    .catch((reason) => {
      showError("Unable to read prescription")
      throw new Error(reason)
    })

  const prescriptionHeaders = [
    "Prescription type",
    "Repeat Prescriptions allowed",
    "Healthcare Provider",
    "Represented Organization"
  ]
  const prescriptionValues = createDisplayPrescription(prescription)
  const prescriptionSummary = prescriptionValues.map((p, i) => 
    `${prescriptionHeaders[i]}: ${p}`
  )
  
  showDisplay(prescriptionSummary.join("<br/>"))

  prescriptions.push(new Prescription(prescriptionValues.map(d => new PrescriptionLine(d))))

  if (prescriptions.length >= 2) {
    resetCompare()
    var lineDiff = new diff.Diff()
    lineDiff.tokenize = function (value) {
      return value.split(/^/m);
    }
    for (let i = 0; i < prescriptions[0].lines.length; i++) {
      const diff = lineDiff.diff(prescriptions[0].lines[i].line, prescriptions[1].lines[i].line),
      display: HTMLElement = document.getElementById('display-value')!,
      fragment: DocumentFragment = document.createDocumentFragment()
      let spanHeader: HTMLElement
      let spanValue: HTMLElement
      diff.forEach((part, j) => {
        const color = part.added ? 'green' :
        part.removed ? 'red' : 'grey';
        if (!(j % 2)) {
          spanHeader = document.createElement('span')
          spanHeader.appendChild(document.createTextNode(`${prescriptionHeaders[i]}: `))
          fragment.appendChild(spanHeader);
        }
        spanValue = document.createElement('span')
        spanValue.style.color = color
        spanValue.appendChild(document.createTextNode(`${part.value}`))
        fragment.appendChild(spanValue);
      });
      fragment.appendChild(document.createElement("br"))
      display.appendChild(fragment)
    }
  }
}

async function createPrescriptionFromFhir(): Promise<DisplayPrescription> {
  const fhirPrescription = JSON.parse(getPrescription())

  const medicationRequests = fhirPrescription.entry.map(e => e.resource).filter(r => r.resourceType === "MedicationRequest")
  const firstMedicationRequest = medicationRequests[0]

  const courseOfTherapy = firstMedicationRequest.courseOfTherapyType.coding[0].code
  const firstMedicationRequestRepeatMedictionExtension = firstMedicationRequest.extension.filter(e => e.url === "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation")[0]
  const numberOfRepeatPrescriptionsAllowed = firstMedicationRequestRepeatMedictionExtension?.extension.filter(e => e.url === "numberOfRepeatPrescriptionsAllowed")[0].valueUnsignedInt

  const organisation = fhirPrescription.entry.map(e => e.resource).filter(r => r.resourceType === "Organization")[0]
  const organisationCode = organisation.identifier.filter(i => i.system === "https://fhir.nhs.uk/Id/ods-organization-code")[0].value
  const organisationName = organisation.name
  const organisationAddressLines = organisation.address[0].line.join(", ")
  const organisationCity = organisation.address[0].city
  const organisationDistrict = organisation.address[0].district
  const organisationPostalCode = organisation.address[0].postalCode

  const practitionerRole = fhirPrescription.entry.map(e => e.resource).filter(r => r.resourceType === "PractitionerRole")[0]
  const healthcareService = practitionerRole.healthcareService?.display || organisationName

  return Promise.resolve({
    courseOfTherapy,
    numberOfRepeatPrescriptionsAllowed,
    healthcareService,
    organisationCode,
    organisationAddressLines,
    organisationCity,
    organisationDistrict,
    organisationPostalCode
  })
}

function createPrescriptionFromHl7(): Promise<DisplayPrescription> {
  const hl7Prescription = XmlJs.xml2js(getPrescription(), {compact: true}) as XmlJs.ElementCompact
  return Promise.resolve({
    courseOfTherapy: hl7Prescription.PORX_IN020101SM31.ControlActEvent.subject.ParentPrescription.pertinentInformation1.pertinentPrescription.pertinentInformation5.pertinentPrescriptionTreatmentType.value._attributes.code,
    numberOfRepeatPrescriptionsAllowed: hl7Prescription.PORX_IN020101SM31.ControlActEvent.subject.ParentPrescription.pertinentInformation1.pertinentPrescription.repeatNumber.high._attributes.value,
    healthcareService: hl7Prescription.PORX_IN020101SM31.ControlActEvent.subject.ParentPrescription.pertinentInformation1.pertinentPrescription.author.AgentPerson.representedOrganization.id._attributes.extension,
    organisationCode: hl7Prescription.PORX_IN020101SM31.ControlActEvent.subject.ParentPrescription.pertinentInformation1.pertinentPrescription.author.AgentPerson.representedOrganization.id._attributes.extension,
    organisationAddressLines: hl7Prescription.PORX_IN020101SM31.ControlActEvent.subject.ParentPrescription.pertinentInformation1.pertinentPrescription.author.AgentPerson.representedOrganization.addr.streetAddressLine.map(s => s._text).join(", "),
    organisationCity: "",
    organisationDistrict: "",
    organisationPostalCode: hl7Prescription.PORX_IN020101SM31.ControlActEvent.subject.ParentPrescription.pertinentInformation1.pertinentPrescription.author.AgentPerson.representedOrganization.addr.postalCode._text
  })
}

function createDisplayPrescription(p: DisplayPrescription): string[] {
  return [
    `${p.courseOfTherapy}`,
    `${p.numberOfRepeatPrescriptionsAllowed ? p.numberOfRepeatPrescriptionsAllowed : "N/A"}`,
    `${p.healthcareService}`,
    `${p.organisationCode} - ${p.organisationAddressLines}, ${p.organisationCity}, ${p.organisationDistrict}, ${p.organisationPostalCode}`,
    // `Prescriber: Primary Care Prescriber - Medical Prescriber - 0101 – Dr C BOIN`,
    // `GMC number: 6095103`,
    // `DIN number: 977677`,
    // `CCG: 84H NHS COUNTY DURHAM CCG`,
    // `Date/Time Signed: 12:01:12`,
    // `Hallgarth Telecom:  0115 9737320`,
    // `Agent Person Telecom: 01234567890  (PractitionerRole)`,
    // `Nominated pharmacy: WARDS OF WARBOYS DISPENSING CHEMISTS  (FCG71)`,
    // `Medication: Paracetamol 500mg soluble tablets`,
    // `Product: Paracetamol 500mg soluble tablets`,
    // `Quantity: 100`,
    // `Dosage instructions: One tablet to be taken four times a day`,
    // `ExpectedUseTime: 30 day Treatment Period for both Medications`,
    // `Pertinent Review Date: 20210811`,
    // `Effective Time (low):  20210305  (validityPeriod - Start)`,
    // `Effective Time high):  2010402 (validityPeriod -End)`
  ]
}
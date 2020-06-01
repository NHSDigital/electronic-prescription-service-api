const XmlJs = require("xml-js")

const codes = require("./hl7-v3-datatypes-codes")
const core = require("./hl7-v3-datatypes-core")
const peoplePlaces = require("./hl7-v3-people-places")
const prescriptions = require("./hl7-v3-prescriptions")

function getResourcesOfType(fhirBundle, resourceType) {
  return fhirBundle.entry
    .map(entry => entry.resource)
    .filter(resource => resource.resourceType === resourceType)
}

function getResourceForFullUrl(fhirBundle, resourceFullUrl) {
  return fhirBundle.entry.filter(entry => entry.fullUrl === resourceFullUrl)[0].resource
}

function getIdentifierValueForSystem(identifier, system) {
  return identifier.filter(identifier => identifier.system === system)[0].value
}

function convertBundleToParentPrescription(fhirBundle) {
  const hl7V3ParentPrescription = new prescriptions.ParentPrescription()

  hl7V3ParentPrescription.id = new codes.Identifier.GlobalIdentifier(fhirBundle.id)
  const fhirMedicationRequests = getResourcesOfType(fhirBundle, "MedicationRequest")
  const fhirFirstMedicationRequest = fhirMedicationRequests[0]
  hl7V3ParentPrescription.effectiveTime = new core.Timestamp(fhirFirstMedicationRequest.authoredOn)

  const fhirPatient = getResourceForFullUrl(fhirBundle, fhirFirstMedicationRequest.subject.reference)
  const hl7V3Patient = convertPatient(fhirBundle, fhirPatient)
  hl7V3ParentPrescription.setRecordTarget(hl7V3Patient)

  const hl7V3Prescription = convertBundleToPrescription(fhirBundle)
  hl7V3ParentPrescription.setPrescription(hl7V3Prescription)

  return hl7V3ParentPrescription
}

function convertPatient(fhirBundle, fhirPatient) {
  const hl7V3Patient = new peoplePlaces.Patient()
  const nhsNumber = getIdentifierValueForSystem(fhirPatient.identifier, "https://fhir.nhs.uk/Id/nhs-number")
  hl7V3Patient.id = new codes.Identifier.NhsNumber(nhsNumber)
  hl7V3Patient.addr = fhirPatient.address.map(convertAddress)

  const hl7V3PatientPerson = new peoplePlaces.Person()
  hl7V3PatientPerson.name = fhirPatient.name.map(convertName)
  hl7V3PatientPerson.administrativeGenderCode = convertGender(fhirPatient.gender)
  hl7V3PatientPerson.birthTime = new core.Timestamp(fhirPatient.birthDate)

  const hl7V3ProviderPatient = new peoplePlaces.ProviderPatient()
  const hl7V3HealthCareProvider = new peoplePlaces.HealthCareProvider()
  const hl7V3PatientCareProvision = new peoplePlaces.PatientCareProvision.PrimaryCare()
  const fhirPractitionerRole = getResourceForFullUrl(fhirBundle, fhirPatient.generalPractitioner.reference)
  const fhirPractitioner = getResourceForFullUrl(fhirBundle, fhirPractitionerRole.practitioner.reference)
  const sdsUniqueId = getIdentifierValueForSystem(fhirPractitioner.identifier, "https://fhir.nhs.uk/Id/sds-user-id")
  hl7V3HealthCareProvider.id = new codes.Identifier.SdsUniqueIdentifier(sdsUniqueId)
  hl7V3PatientCareProvision.setHealthCareProvider(hl7V3HealthCareProvider)
  hl7V3ProviderPatient.setSubjectOf(hl7V3PatientCareProvision)
  hl7V3PatientPerson.playedProviderPatient = hl7V3ProviderPatient

  hl7V3Patient.patientPerson = hl7V3PatientPerson

  return hl7V3Patient
}

function convertBundleToPrescription(fhirBundle) {
  let hl7V3Prescription = new prescriptions.Prescription()

  const fhirMedicationRequests = getResourcesOfType(fhirBundle, "MedicationRequest")
  const fhirFirstMedicationRequest = fhirMedicationRequests[0]
  const prescriptionId = getIdentifierValueForSystem(fhirFirstMedicationRequest.groupIdentifier, "urn:uuid")
  const prescriptionShortFormId = getIdentifierValueForSystem(fhirFirstMedicationRequest.groupIdentifier, "urn:oid:2.16.840.1.113883.2.1.3.2.4.18.8")
  hl7V3Prescription.id = [
    new codes.Identifier.GlobalIdentifier(prescriptionId),
    new codes.Identifier.ShortFormPrescriptionIdentifier(prescriptionShortFormId)
  ]

  const hl7V3Author = new prescriptions.Author()
  hl7V3Author.time = new core.Timestamp(fhirFirstMedicationRequest.authoredOn)
  hl7V3Author.signatureText = {}
  const fhirAuthorPractitionerRole = getResourceForFullUrl(fhirBundle, fhirFirstMedicationRequest.requester.reference)
  hl7V3Author.AgentPerson = convertPractitionerRole(fhirBundle, fhirAuthorPractitionerRole)
  hl7V3Prescription.author = hl7V3Author

  const responsibleParty = new prescriptions.ResponsibleParty()
  const fhirPatient = getResourceForFullUrl(fhirBundle, fhirFirstMedicationRequest.subject.reference)
  const fhirResponsiblePartyPractitionerRole = getResourceForFullUrl(fhirBundle, fhirPatient.generalPractitioner.reference)
  responsibleParty.AgentPerson = convertPractitionerRole(fhirBundle, fhirResponsiblePartyPractitionerRole)
  hl7V3Prescription.responsibleParty = responsibleParty

  //TODO - implement
  const prescriptionTreatmentType = new prescriptions.PrescriptionAnnotation.PrescriptionTreatmentType()
  prescriptionTreatmentType.value = new codes.Code.PrescriptionTreatmentTypeCode("0001")
  hl7V3Prescription.setPrescriptionTreatmentType(prescriptionTreatmentType)

  //TODO - implement
  const dispensingSitePreference = new prescriptions.PrescriptionAnnotation.DispensingSitePreference()
  dispensingSitePreference.value = new codes.Code.DispensingSitePreferenceCode("0004")
  hl7V3Prescription.setDispensingSitePreference(dispensingSitePreference)

  //TODO - implement
  const tokenIssued = new prescriptions.PrescriptionAnnotation.TokenIssued()
  tokenIssued.value = core.Bool.TRUE
  hl7V3Prescription.setTokenIssued(tokenIssued)

  const prescriptionType = new prescriptions.PrescriptionAnnotation.PrescriptionType()
  const fhirMedicationRequestCategoryCoding = fhirFirstMedicationRequest.category.coding
  prescriptionType.value = new codes.Code.PrescriptionTypeCode(fhirMedicationRequestCategoryCoding.code)
  hl7V3Prescription.setPrescriptionType(prescriptionType)

  fhirMedicationRequests.map(convertMedicationRequestToLineItem)
    .forEach(hl7V3LineItem => hl7V3Prescription.addLineItem(hl7V3LineItem))

  return hl7V3Prescription
}

function convertMedicationRequestToLineItem(fhirMedicationRequest) {
  let hl7V3LineItem = new prescriptions.LineItem()

  const fhirMedicationCode = fhirMedicationRequest.medicationCodeableConcept.coding
  const hl7V3MedicationCode = new codes.Code.SnomedCode(fhirMedicationCode.code, fhirMedicationCode.display)
  hl7V3LineItem.setProductCode(hl7V3MedicationCode)

  const hl7V3DosageInstructions = new prescriptions.PrescriptionAnnotation.DosageInstructions()
  hl7V3DosageInstructions.value = fhirMedicationRequest.dosageInstruction.text
  hl7V3LineItem.setDosageInstructions(hl7V3DosageInstructions)

  const hl7V3Quantity = new prescriptions.LineItemQuantity()
  const fhirQuantity = fhirMedicationRequest.dispenseRequest.quantity
  const hl7V3UnitCode = new codes.Code.SnomedCode(fhirQuantity.code, fhirQuantity.unit)
  hl7V3Quantity.quantity = new core.QuantityInAlternativeUnits(fhirQuantity.value, fhirQuantity.value, hl7V3UnitCode)
  hl7V3LineItem.setLineItemQuantity(hl7V3Quantity)

  return hl7V3LineItem
}

function convertPractitionerRole(fhirBundle, fhirPractitionerRole) {
  const fhirPractitioner = getResourceForFullUrl(fhirBundle, fhirPractitionerRole.practitioner.reference)
  const hl7V3AgentPerson = convertPractitioner(fhirBundle, fhirPractitioner)
  const fhirOrganization = getResourceForFullUrl(fhirBundle, fhirPractitionerRole.organization.reference)
  hl7V3AgentPerson.representedOrganization = convertOrganization(fhirBundle, fhirOrganization)
  return hl7V3AgentPerson
}

function convertPractitioner(fhirBundle, fhirPractitioner) {
  let hl7V3AgentPerson = new peoplePlaces.AgentPerson()

  const sdsRoleProfileIdentifier = getIdentifierValueForSystem(fhirPractitioner.identifier, "https://fhir.nhs.uk/Id/sds-role-profile-id")
  hl7V3AgentPerson.id = new codes.Identifier.SdsRoleProfileIdentifier(sdsRoleProfileIdentifier)
  const sdsJobRoleCode = getIdentifierValueForSystem(fhirPractitioner.identifier, "https://fhir.nhs.uk/Id/sds-job-role-id")
  hl7V3AgentPerson.code = new codes.Code.SdsJobRoleCode(sdsJobRoleCode)
  if (fhirPractitioner.telecom) {
    hl7V3AgentPerson.telecom = fhirPractitioner.telecom.map(convertTelecom)
  }

  const hl7V3AgentPersonPerson = new peoplePlaces.Person()
  const sdsUniqueIdentifier = getIdentifierValueForSystem(fhirPractitioner.identifier, "https://fhir.nhs.uk/Id/sds-user-id")
  hl7V3AgentPersonPerson.id = new codes.Identifier.SdsUniqueIdentifier(sdsUniqueIdentifier)
  if (fhirPractitioner.name) {
    hl7V3AgentPersonPerson.name = fhirPractitioner.name.map(convertName)
  }

  hl7V3AgentPerson.agentPerson = hl7V3AgentPersonPerson

  return hl7V3AgentPerson
}

function convertOrganization(fhirBundle, fhirOrganization) {
  const hl7V3Organization = new peoplePlaces.Organization()

  const organizationSdsId = getIdentifierValueForSystem(fhirOrganization.identifier, "https://fhir.nhs.uk/Id/ods-organization-code")
  hl7V3Organization.id = new codes.Identifier.SdsOrganizationIdentifier(organizationSdsId)
  const organizationTypeCode = fhirOrganization.type
    .flatMap(type => type.coding)
    .filter(coding => coding.system === "urn:oid:2.16.840.1.113883.2.1.3.2.4.17.94")[0].code
  hl7V3Organization.code = new codes.Code.OrganizationTypeCode(organizationTypeCode)
  hl7V3Organization.name = fhirOrganization.name
  if (fhirOrganization.telecom) {
    hl7V3Organization.telecom = fhirOrganization.telecom.map(convertTelecom)
  }
  if (fhirOrganization.address) {
    hl7V3Organization.addr = fhirOrganization.address.map(convertAddress)
  }

  if (fhirOrganization.partOf) {
    const fhirParentOrganization = getResourceForFullUrl(fhirBundle, fhirOrganization.partOf.reference)
    const hl7V3ParentOrganization = convertOrganization(fhirBundle, fhirParentOrganization)
    hl7V3Organization.setHealthCareProviderLicense(hl7V3ParentOrganization)
  }

  return hl7V3Organization
}

function convertName(fhirHumanName) {
  return new core.Name(fhirHumanName.family, fhirHumanName.given, fhirHumanName.prefix, fhirHumanName.suffix)
}

function convertTelecom(fhirTelecom) {
  const hl7V3TelecomUse = convertTelecomUse(fhirTelecom.use)
  return new core.Telecom(hl7V3TelecomUse, fhirTelecom.value)
}

function convertTelecomUse(fhirTelecomUse) {
  switch (fhirTelecomUse) {
    case "home":
      return core.Telecom.USE_PERMANENT_HOME
    case "work":
      return core.Telecom.USE_WORKPLACE
    case "temp":
      return core.Telecom.USE_TEMPORARY
    case "mobile":
      return core.Telecom.USE_MOBILE
    default:
      //TODO use more specific error class
      throw Error("Unhandled telecom use " + fhirTelecomUse)
  }
}

function convertAddress(fhirAddress) {
  const hl7V3AddressUse = convertAddressUse(fhirAddress.use, fhirAddress.type)
  let hl7V3AddressLines = []
  if (fhirAddress.line) {
    hl7V3AddressLines = hl7V3AddressLines.concat(fhirAddress.line)
  }
  if (fhirAddress.city) {
    hl7V3AddressLines = hl7V3AddressLines.concat(fhirAddress.city)
  }
  if (fhirAddress.district) {
    hl7V3AddressLines = hl7V3AddressLines.concat(fhirAddress.district)
  }
  if (fhirAddress.state) {
    hl7V3AddressLines = hl7V3AddressLines.concat(fhirAddress.state)
  }
  return new core.Address(hl7V3AddressUse, hl7V3AddressLines, fhirAddress.postalCode)
}

function convertAddressUse(fhirAddressUse, fhirAddressType) {
  if (fhirAddressType === "postal") {
    return core.Address.USE_POSTAL
  }
  switch (fhirAddressUse) {
    case "home":
      return core.Address.USE_HOME
    case "work":
      return core.Address.USE_WORK
    case "temp":
      return core.Address.USE_TEMPORARY
    default:
      //TODO use more specific error class
      throw Error("Unhandled address use " + fhirAddressUse)
  }
}

function convertGender(fhirGender) {
  switch (fhirGender) {
    case "male":
      return codes.Code.SexCode.MALE
    case "female":
      return codes.Code.SexCode.FEMALE
    case "other":
      return codes.Code.SexCode.INDETERMINATE
    case "unknown":
      return codes.Code.SexCode.UNKNOWN
    default:
      //TODO use more specific error class
      throw new Error("Unhandled gender " + fhirGender)
  }
}

function convertFhirMessageToHl7V3ParentPrescription(fhirMessage) {
  const root = {ParentPrescription: convertBundleToParentPrescription(fhirMessage)}
  const options = {compact: true, ignoreComment: true, spaces: 4}
  //TODO - canonicalize XML before returning
  return XmlJs.js2xml(root, options)
}

module.exports = {
  convertFhirMessageToHl7V3ParentPrescription: convertFhirMessageToHl7V3ParentPrescription
}

import * as fhir from "../../../models/fhir/fhir-resources"
import {PractitionerRole} from "../../../models/fhir/fhir-resources"
import * as peoplePlaces from "../../../models/hl7-v3/hl7-v3-people-places"
import * as codes from "../../../models/hl7-v3/hl7-v3-datatypes-codes"
import {convertName, convertTelecom} from "./demographics"
import * as prescriptions from "../../../models/hl7-v3/hl7-v3-prescriptions"
import {
  convertIsoDateTimeStringToHl7V3DateTime,
  getCodeableConceptCodingForSystem,
  getExtensionForUrlOrNull,
  getIdentifierValueForSystem,
  getIdentifierValueOrNullForSystem, onlyElement, onlyElementOrNull,
  resolveReference
} from "../common"
import * as XmlJs from "xml-js"
import * as core from "../../../models/hl7-v3/hl7-v3-datatypes-core"
import {convertOrganizationAndProviderLicense} from "./organization"
import {getProvenances} from "../common/getResourcesOfType"
import * as errors from "../../../models/errors/processing-errors"

export function convertAuthor(
  fhirBundle: fhir.Bundle,
  fhirFirstMedicationRequest: fhir.MedicationRequest,
  isCancellation: boolean,
  convertPractitionerRoleFn = convertPractitionerRole
): prescriptions.Author {
  const hl7V3Author = new prescriptions.Author()
  if (!isCancellation) {
    hl7V3Author.time = convertIsoDateTimeStringToHl7V3DateTime(
      fhirFirstMedicationRequest.authoredOn,
      "MedicationRequest.authoredOn"
    )
    hl7V3Author.signatureText = convertSignatureText(fhirBundle, fhirFirstMedicationRequest.requester)
  }
  const fhirAuthorPractitionerRole = resolveReference(fhirBundle, fhirFirstMedicationRequest.requester)
  hl7V3Author.AgentPerson = convertPractitionerRoleFn(fhirBundle, fhirAuthorPractitionerRole, isCancellation)
  return hl7V3Author
}

export function convertResponsibleParty(
  fhirBundle: fhir.Bundle,
  fhirMedicationRequest: fhir.MedicationRequest,
  isCancellation: boolean,
  convertPractitionerRoleFn = convertPractitionerRole
): prescriptions.ResponsibleParty {
  const responsibleParty = new prescriptions.ResponsibleParty()
  const fhirResponsiblePartyExtension = getExtensionForUrlOrNull(
    fhirMedicationRequest.extension,
    "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-ResponsiblePractitioner",
    "MedicationRequest.extension"
  ) as fhir.ReferenceExtension<PractitionerRole>
  const fhirResponsibleParty = fhirResponsiblePartyExtension
    ? fhirResponsiblePartyExtension.valueReference
    : fhirMedicationRequest.requester
  const fhirResponsiblePartyPractitionerRole = resolveReference(fhirBundle, fhirResponsibleParty)
  responsibleParty.AgentPerson = convertPractitionerRoleFn(
    fhirBundle,
    fhirResponsiblePartyPractitionerRole,
    isCancellation
  )
  return responsibleParty
}

function convertPractitionerRole(
  fhirBundle: fhir.Bundle,
  fhirPractitionerRole: fhir.PractitionerRole,
  isCancellation: boolean
): peoplePlaces.AgentPerson {
  const fhirPractitioner = resolveReference(fhirBundle, fhirPractitionerRole.practitioner)
  const hl7V3AgentPerson = createAgentPerson(fhirPractitionerRole, fhirPractitioner)
  const fhirOrganization = resolveReference(fhirBundle, fhirPractitionerRole.organization)
  let fhirHealthcareService: fhir.HealthcareService
  if (fhirPractitionerRole.healthcareService) {
    fhirHealthcareService = resolveReference(fhirBundle, fhirPractitionerRole.healthcareService[0])
  }
  hl7V3AgentPerson.representedOrganization = convertOrganizationAndProviderLicense(
    fhirBundle,
    fhirOrganization,
    fhirHealthcareService,
    isCancellation
  )
  return hl7V3AgentPerson
}

function createAgentPerson(
  fhirPractitionerRole: fhir.PractitionerRole,
  fhirPractitioner: fhir.Practitioner,
  convertAgentPersonPersonFn = convertAgentPersonPerson
): peoplePlaces.AgentPerson {
  const hl7V3AgentPerson = new peoplePlaces.AgentPerson()

  const sdsRoleProfileIdentifier = getIdentifierValueForSystem(
    fhirPractitionerRole.identifier,
    "https://fhir.nhs.uk/Id/sds-role-profile-id",
    "PractitionerRole.identifier"
  )
  hl7V3AgentPerson.id = new codes.SdsRoleProfileIdentifier(sdsRoleProfileIdentifier)

  const sdsJobRoleCode = getCodeableConceptCodingForSystem(
    fhirPractitionerRole.code,
    "https://fhir.nhs.uk/R4/CodeSystem/UKCore-SDSJobRoleName",
    "PractitionerRole.code"
  )
  hl7V3AgentPerson.code = new codes.SdsJobRoleCode(sdsJobRoleCode.code)

  hl7V3AgentPerson.telecom = getAgentPersonTelecom(fhirPractitionerRole.telecom, fhirPractitioner.telecom)

  hl7V3AgentPerson.agentPerson = convertAgentPersonPersonFn(fhirPractitionerRole, fhirPractitioner)

  return hl7V3AgentPerson
}

export function getAgentPersonTelecom(
  fhirPractitionerRoleTelecom: Array<fhir.ContactPoint>,
  fhirPractitionerTelecom: Array<fhir.ContactPoint>
): Array<core.Telecom> {
  if (fhirPractitionerRoleTelecom !== undefined) {
    return fhirPractitionerRoleTelecom.map(telecom => convertTelecom(telecom, "PractitionerRole.telecom"))
  } else if (fhirPractitionerTelecom !== undefined) {
    return fhirPractitionerTelecom.map(telecom => convertTelecom(telecom, "Practitioner.telecom"))
  }
}

function convertAgentPersonPerson(fhirPractitionerRole: fhir.PractitionerRole, fhirPractitioner: fhir.Practitioner) {
  const id = getAgentPersonPersonId(fhirPractitioner.identifier)
  const hl7V3AgentPersonPerson = new peoplePlaces.AgentPersonPerson(id)
  if (fhirPractitioner.name !== undefined) {
    hl7V3AgentPersonPerson.name = convertName(
      onlyElement(fhirPractitioner.name, "Practitioner.name"),
      "Practitioner.name"
    )
  }
  return hl7V3AgentPersonPerson
}

export function getAgentPersonPersonId(
  fhirPractitionerIdentifier: Array<fhir.Identifier>
): peoplePlaces.PrescriptionAuthorId {
  const professionalCode: Array<codes.ProfessionalCode> = []

  const gmcCode = getIdentifierValueOrNullForSystem(
    fhirPractitionerIdentifier,
    "https://fhir.hl7.org.uk/Id/gmc-number",
    "Practitioner.identifier"
  )
  if (gmcCode) {
    professionalCode.push(new codes.ProfessionalCode(gmcCode))
  }

  const gmpCode = getIdentifierValueOrNullForSystem(
    fhirPractitionerIdentifier,
    "https://fhir.hl7.org.uk/Id/gmp-number",
    "Practitioner.identifier"
  )
  if (gmpCode) {
    professionalCode.push(new codes.ProfessionalCode(gmpCode))
  }

  const nmcCode = getIdentifierValueOrNullForSystem(
    fhirPractitionerIdentifier,
    "https://fhir.hl7.org.uk/Id/nmc-number",
    "Practitioner.identifier"
  )
  if (nmcCode) {
    professionalCode.push(new codes.ProfessionalCode(nmcCode))
  }

  const gphcCode = getIdentifierValueOrNullForSystem(
    fhirPractitionerIdentifier,
    "https://fhir.hl7.org.uk/Id/gphc-number",
    "Practitioner.identifier"
  )
  if (gphcCode) {
    professionalCode.push(new codes.ProfessionalCode(gphcCode))
  }

  const hcpcCode = getIdentifierValueOrNullForSystem(
    fhirPractitionerIdentifier,
    "https://fhir.hl7.org.uk/Id/hcpc-number",
    "Practitioner.identifier"
  )
  if (hcpcCode) {
    professionalCode.push(new codes.ProfessionalCode(hcpcCode))
  }

  if (professionalCode.length === 1) {
    return professionalCode[0]
  }

  const error = "Expected exactly one professional code. One of GMC, GMP, NMC, GPhC or HCPC"
  const errorAdditionalContext = professionalCode.map(code => code._attributes.extension).join(", ")
  const errorMessage = `${error}. ${errorAdditionalContext.length > 0 ? "But got: " + errorAdditionalContext : ""}`
  const errorPath = "PractitionerRole.identifier"

  console.log(JSON.stringify(fhirPractitionerIdentifier))
  console.log(errorMessage)

  throw professionalCode.length > 1
    ? new errors.TooManyValuesError(errorMessage, errorPath)
    : new errors.TooFewValuesError(errorMessage, errorPath)
}

function convertSignatureText(fhirBundle: fhir.Bundle, signatory: fhir.Reference<fhir.PractitionerRole>) {
  const fhirProvenances = getProvenances(fhirBundle)
  const requesterSignatures = fhirProvenances.flatMap(provenance => provenance.signature)
    .filter(signature => signature.who.reference === signatory.reference)
  const requesterSignature = onlyElementOrNull(
    requesterSignatures,
    "Provenance.signature",
    `who.reference == '${signatory.reference}'`
  )
  if (requesterSignature) {
    const signatureData = requesterSignature.data
    const decodedSignatureData = Buffer.from(signatureData, "base64").toString("utf-8")
    return XmlJs.xml2js(decodedSignatureData, {compact: true})
  }
  return core.Null.NOT_APPLICABLE
}

import * as fhir from "../../model/fhir-resources"
import {PractitionerRole} from "../../model/fhir-resources"
import * as peoplePlaces from "../../model/hl7-v3-people-places"
import * as codes from "../../model/hl7-v3-datatypes-codes"
import {convertName, convertTelecom} from "./demographics"
import * as prescriptions from "../../model/hl7-v3-prescriptions"
import {
  convertIsoStringToDateTime,
  getCodeableConceptCodingForSystem,
  getExtensionForUrlOrNull,
  getIdentifierValueForSystem,
  getIdentifierValueOrNullForSystem, onlyElement,
  resolveReference
} from "./common"
import * as XmlJs from "xml-js"
import * as core from "../../model/hl7-v3-datatypes-core"
import {convertOrganizationAndProviderLicense} from "./organization"
import {getProvenances} from "./common/getResourcesOfType"

export function convertAuthor(
  fhirBundle: fhir.Bundle,
  fhirFirstMedicationRequest: fhir.MedicationRequest,
  convertPractitionerRoleFn = convertPractitionerRole
): prescriptions.Author {
  const hl7V3Author = new prescriptions.Author()
  hl7V3Author.time = convertIsoStringToDateTime(fhirFirstMedicationRequest.authoredOn, "MedicationRequest.authoredOn")
  hl7V3Author.signatureText = convertSignatureText(fhirBundle, fhirFirstMedicationRequest.requester)
  const fhirAuthorPractitionerRole = resolveReference(fhirBundle, fhirFirstMedicationRequest.requester)
  hl7V3Author.AgentPerson = convertPractitionerRoleFn(fhirBundle, fhirAuthorPractitionerRole)
  return hl7V3Author
}

export function convertResponsibleParty(
  fhirBundle: fhir.Bundle,
  fhirMedicationRequest: fhir.MedicationRequest,
  convertPractitionerRoleFn = convertPractitionerRole
): prescriptions.ResponsibleParty {
  const responsibleParty = new prescriptions.ResponsibleParty()
  const fhirResponsiblePartyExtension = getExtensionForUrlOrNull(
    fhirMedicationRequest.extension,
    "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-ResponsiblePractitioner",
    "MedicationRequest.extension"
  ) as fhir.ReferenceExtension<PractitionerRole>
  const fhirResponsibleParty = fhirResponsiblePartyExtension ? fhirResponsiblePartyExtension.valueReference : fhirMedicationRequest.requester
  const fhirResponsiblePartyPractitionerRole = resolveReference(fhirBundle, fhirResponsibleParty)
  responsibleParty.AgentPerson = convertPractitionerRoleFn(fhirBundle, fhirResponsiblePartyPractitionerRole)
  return responsibleParty
}

function convertPractitionerRole(fhirBundle: fhir.Bundle, fhirPractitionerRole: fhir.PractitionerRole): peoplePlaces.AgentPerson {
  const fhirPractitioner = resolveReference(fhirBundle, fhirPractitionerRole.practitioner)
  const hl7V3AgentPerson = createAgentPerson(fhirBundle, fhirPractitionerRole, fhirPractitioner)
  const fhirOrganization = resolveReference(fhirBundle, fhirPractitionerRole.organization)
  hl7V3AgentPerson.representedOrganization = convertOrganizationAndProviderLicense(fhirBundle, fhirOrganization)
  return hl7V3AgentPerson
}

function createAgentPerson(
  fhirBundle: fhir.Bundle,
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

export function getAgentPersonTelecom(fhirPractitionerRoleTelecom: Array<fhir.ContactPoint>, fhirPractitionerTelecom: Array<fhir.ContactPoint>): Array<core.Telecom> {
  if (fhirPractitionerRoleTelecom !== undefined) {
    return fhirPractitionerRoleTelecom.map(telecom => convertTelecom(telecom, "PractitionerRole.telecom"))
  } else if (fhirPractitionerTelecom !== undefined) {
    return fhirPractitionerTelecom.map(telecom => convertTelecom(telecom, "Practitioner.telecom"))
  }
}

function convertAgentPersonPerson(fhirPractitionerRole: fhir.PractitionerRole, fhirPractitioner: fhir.Practitioner) {
  const id = getAgentPersonPersonId(fhirPractitionerRole.identifier, fhirPractitioner.identifier)
  const hl7V3AgentPersonPerson = new peoplePlaces.AgentPersonPerson(id)
  if (fhirPractitioner.name !== undefined) {
    hl7V3AgentPersonPerson.name = onlyElement(
      fhirPractitioner.name.map(name => convertName(name, "Practitioner.name")),
      "Practitioner.name"
    )
  }
  return hl7V3AgentPersonPerson
}

export function getAgentPersonPersonId(fhirPractitionerRoleIdentifier: Array<fhir.Identifier>, fhirPractitionerIdentifier: Array<fhir.Identifier>): peoplePlaces.PrescriptionAuthorId {
  const spuriousCode = getIdentifierValueOrNullForSystem(
    fhirPractitionerRoleIdentifier,
    "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
    "PractitionerRole.identifier"
  )
  if (spuriousCode) {
    return new codes.BsaPrescribingIdentifier(spuriousCode)
  }

  const dinCode = getIdentifierValueOrNullForSystem(
    fhirPractitionerIdentifier,
    "https://fhir.hl7.org.uk/Id/din-number",
    "Practitioner.identifier"
  )
  if (dinCode) {
    return new codes.BsaPrescribingIdentifier(dinCode)
  }

  const sdsUniqueIdentifier = getIdentifierValueForSystem(
    fhirPractitionerIdentifier,
    "https://fhir.nhs.uk/Id/sds-user-id",
    "Practitioner.identifier"
  )
  return new codes.SdsUniqueIdentifier(sdsUniqueIdentifier)
}

function convertSignatureText(fhirBundle: fhir.Bundle, signatory: fhir.Reference<fhir.PractitionerRole>) {
  const fhirProvenances = getProvenances(fhirBundle)
  const requesterSignatures = fhirProvenances.flatMap(provenance => provenance.signature)
    .filter(signature => signature.who.reference === signatory.reference)
  if (requesterSignatures.length !== 0) {
    const requesterSignature = onlyElement(requesterSignatures, "Provenance.signature", `who.reference == '${signatory.reference}'`)
    const signatureData = requesterSignature.data
    const decodedSignatureData = Buffer.from(signatureData, "base64").toString("utf-8")
    return XmlJs.xml2js(decodedSignatureData, {compact: true})
  }
  return core.Null.NOT_APPLICABLE
}

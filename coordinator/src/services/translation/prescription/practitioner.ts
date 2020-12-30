import * as fhir from "../../../models/fhir/fhir-resources"
import {PractitionerRole} from "../../../models/fhir/fhir-resources"
import * as peoplePlaces from "../../../models/hl7-v3/hl7-v3-people-places"
import * as codes from "../../../models/hl7-v3/hl7-v3-datatypes-codes"
import {convertName, convertTelecom} from "./demographics"
import * as prescriptions from "../../../models/hl7-v3/hl7-v3-prescriptions"
import {
  convertIsoDateTimeStringToHl7V3DateTime,
  convertMomentToHl7V3DateTime,
  getCodeableConceptCodingForSystem,
  getExtensionForUrlOrNull,
  getIdentifierValueForSystem,
  getIdentifierValueOrNullForSystem,
  onlyElement,
  onlyElementOrNull,
  resolveReference
} from "../common"
import * as XmlJs from "xml-js"
import * as core from "../../../models/hl7-v3/hl7-v3-datatypes-core"
import {convertOrganizationAndProviderLicense} from "./organization"
import {getProvenances} from "../common/getResourcesOfType"
import * as errors from "../../../models/errors/processing-errors"
import {identifyMessageType, MessageType} from "../../../routes/util"
import moment from "moment"
import {InvalidValueError} from "../../../models/errors/processing-errors"

export function convertAuthor(
  fhirBundle: fhir.Bundle,
  fhirFirstMedicationRequest: fhir.MedicationRequest
): prescriptions.Author {
  const hl7V3Author = new prescriptions.Author()
  if (identifyMessageType(fhirBundle) !== MessageType.CANCELLATION) {
    const requesterSignature = findRequesterSignature(fhirBundle, fhirFirstMedicationRequest.requester)
    setSignatureTimeAndText(hl7V3Author, requesterSignature)
  }
  const fhirAuthorPractitionerRole = resolveReference(fhirBundle, fhirFirstMedicationRequest.requester)
  hl7V3Author.AgentPerson = convertPractitionerRole(fhirBundle, fhirAuthorPractitionerRole)
  return hl7V3Author
}

function setSignatureTimeAndText(hl7V3Author: prescriptions.Author, requesterSignature?: fhir.Signature) {
  if (requesterSignature) {
    hl7V3Author.time = convertIsoDateTimeStringToHl7V3DateTime(requesterSignature.when, "Provenance.signature.when")
    try {
      const decodedSignatureData = Buffer.from(requesterSignature.data, "base64").toString("utf-8")
      hl7V3Author.signatureText = XmlJs.xml2js(decodedSignatureData, {compact: true})
    } catch (e) {
      throw new InvalidValueError("Invalid signature format.", "Provenance.signature.data")
    }
  } else {
    hl7V3Author.time = convertMomentToHl7V3DateTime(moment.utc())
    hl7V3Author.signatureText = core.Null.NOT_APPLICABLE
  }
}

export function convertResponsibleParty(
  fhirBundle: fhir.Bundle,
  fhirMedicationRequest: fhir.MedicationRequest,
  convertPractitionerRoleFn = convertPractitionerRole,
  convertAgentPersonPersonFn = convertAgentPersonPerson,
  getAgentPersonPersonIdFn = getAgentPersonPersonIdForResponsibleParty
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
    convertAgentPersonPersonFn,
    getAgentPersonPersonIdFn
  )

  return responsibleParty
}

function convertPractitionerRole(
  fhirBundle: fhir.Bundle,
  fhirPractitionerRole: fhir.PractitionerRole,
  convertAgentPersonPersonFn = convertAgentPersonPerson,
  getAgentPersonPersonIdFn = getAgentPersonPersonIdForAuthor
): peoplePlaces.AgentPerson {
  const fhirPractitioner = resolveReference(fhirBundle, fhirPractitionerRole.practitioner)

  const hl7V3AgentPerson = createAgentPerson(
    fhirPractitionerRole,
    fhirPractitioner,
    convertAgentPersonPersonFn,
    getAgentPersonPersonIdFn
  )

  const fhirOrganization = resolveReference(fhirBundle, fhirPractitionerRole.organization)

  let fhirHealthcareService: fhir.HealthcareService
  if (fhirPractitionerRole.healthcareService) {
    fhirHealthcareService = resolveReference(fhirBundle, fhirPractitionerRole.healthcareService[0])
  }

  hl7V3AgentPerson.representedOrganization = convertOrganizationAndProviderLicense(
    fhirBundle,
    fhirOrganization,
    fhirHealthcareService
  )

  return hl7V3AgentPerson
}

function createAgentPerson(
  fhirPractitionerRole: fhir.PractitionerRole,
  fhirPractitioner: fhir.Practitioner,
  convertAgentPersonPersonFn = convertAgentPersonPerson,
  getAgentPersonPersonIdFn = getAgentPersonPersonIdForAuthor
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

  hl7V3AgentPerson.agentPerson =
    convertAgentPersonPersonFn(
      fhirPractitionerRole,
      fhirPractitioner,
      getAgentPersonPersonIdFn)

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

function convertAgentPersonPerson(
  fhirPractitionerRole: fhir.PractitionerRole,
  fhirPractitioner: fhir.Practitioner,
  getAgentPersonPersonIdFn = getAgentPersonPersonIdForAuthor) {
  const id = getAgentPersonPersonIdFn(fhirPractitioner.identifier, fhirPractitionerRole.identifier)
  const hl7V3AgentPersonPerson = new peoplePlaces.AgentPersonPerson(id)
  if (fhirPractitioner.name !== undefined) {
    hl7V3AgentPersonPerson.name = convertName(
      onlyElement(fhirPractitioner.name, "Practitioner.name"),
      "Practitioner.name"
    )
  }
  return hl7V3AgentPersonPerson
}

export function getAgentPersonPersonIdForAuthor(
  fhirPractitionerIdentifier: Array<fhir.Identifier>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fhirPractitionerRoleIdentifier: Array<fhir.Identifier> = []
): peoplePlaces.PrescriptionAuthorId {
  const professionalCode: Array<codes.ProfessionalCode> = []

  let gmcCode = getIdentifierValueOrNullForSystem(
    fhirPractitionerIdentifier,
    "https://fhir.hl7.org.uk/Id/gmc-number",
    "Practitioner.identifier"
  )
  if (gmcCode) {
    if(gmcCode.toUpperCase().startsWith("C")) {
      gmcCode = gmcCode.substring(1)
    }
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

  const error = "Expected exactly one professional code. One of GMC|GMP|NMC|GPhC|HCPC"
  const errorAdditionalContext = professionalCode.map(code => code._attributes.extension).join(", ")
  const errorMessage = `${error}. ${errorAdditionalContext.length > 0 ? "But got: " + errorAdditionalContext : ""}`
  const errorPath = "Practitioner.identifier"

  throw professionalCode.length > 1
    ? new errors.TooManyValuesError(errorMessage, errorPath)
    : new errors.TooFewValuesError(errorMessage, errorPath)
}

export function getAgentPersonPersonIdForResponsibleParty(
  fhirPractitionerIdentifier: Array<fhir.Identifier>,
  fhirPractitionerRoleIdentifier: Array<fhir.Identifier>
): peoplePlaces.PrescriptionAuthorId {

  const spuriousCode = getIdentifierValueOrNullForSystem(
    fhirPractitionerRoleIdentifier,
    "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
    "PractitionerRole.identifier"
  )
  if (spuriousCode) {
    return new codes.PrescribingCode(spuriousCode)
  }

  const dinCode = getIdentifierValueOrNullForSystem(
    fhirPractitionerIdentifier,
    "https://fhir.hl7.org.uk/Id/din-number",
    "Practitioner.identifier"
  )
  if (dinCode) {
    return new codes.PrescribingCode(dinCode)
  }

  return getAgentPersonPersonIdForAuthor(fhirPractitionerIdentifier)
}

function findRequesterSignature(fhirBundle: fhir.Bundle, signatory: fhir.Reference<PractitionerRole>) {
  const fhirProvenances = getProvenances(fhirBundle)
  const requesterSignatures = fhirProvenances.flatMap(provenance => provenance.signature)
    .filter(signature => signature.who.reference === signatory.reference)
  return onlyElementOrNull(
    requesterSignatures,
    "Provenance.signature",
    `who.reference == '${signatory.reference}'`
  )
}

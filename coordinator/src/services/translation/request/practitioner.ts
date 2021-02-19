import {convertName, convertTelecom} from "./demographics"
import {
  getCodeableConceptCodingForSystem,
  getExtensionForUrlOrNull,
  getIdentifierValueForSystem,
  getIdentifierValueOrNullForSystem,
  onlyElement,
  onlyElementOrNull,
  resolveReference
} from "../common"
import * as XmlJs from "xml-js"
import {convertOrganizationAndProviderLicense} from "./organization"
import {getProvenances} from "../common/getResourcesOfType"
import * as errors from "../../../models/errors/processing-errors"
import {InvalidValueError} from "../../../models/errors/processing-errors"
import {identifyMessageType} from "../../../routes/util"
import moment from "moment"
import {convertIsoDateTimeStringToHl7V3DateTime, convertMomentToHl7V3DateTime} from "../common/dateTime"
import * as hl7V3 from "../../../models/hl7-v3"
import * as fhir from "../../../models/fhir"

export function convertAuthor(
  bundle: fhir.Bundle,
  fhirFirstMedicationRequest: fhir.MedicationRequest
): hl7V3.Author {
  const hl7V3Author = new hl7V3.Author()
  if (identifyMessageType(bundle) !== fhir.EventCodingCode.CANCELLATION) {
    const requesterSignature = findRequesterSignature(bundle, fhirFirstMedicationRequest.requester)
    setSignatureTimeAndText(hl7V3Author, requesterSignature)
  }
  const fhirAuthorPractitionerRole = resolveReference(bundle, fhirFirstMedicationRequest.requester)
  hl7V3Author.AgentPerson = convertPractitionerRole(bundle, fhirAuthorPractitionerRole)
  return hl7V3Author
}

function setSignatureTimeAndText(hl7V3Author: hl7V3.Author, requesterSignature?: fhir.Signature) {
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
    hl7V3Author.signatureText = hl7V3.Null.NOT_APPLICABLE
  }
}

export function convertResponsibleParty(
  bundle: fhir.Bundle,
  fhirMedicationRequest: fhir.MedicationRequest,
  convertPractitionerRoleFn = convertPractitionerRole,
  convertAgentPersonPersonFn = convertAgentPersonPerson,
  getAgentPersonPersonIdFn = getAgentPersonPersonIdForResponsibleParty
): hl7V3.ResponsibleParty {
  const responsibleParty = new hl7V3.ResponsibleParty()

  const fhirResponsiblePartyExtension = getExtensionForUrlOrNull(
    fhirMedicationRequest.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner",
    "MedicationRequest.extension"
  ) as fhir.ReferenceExtension<fhir.PractitionerRole>

  const fhirResponsibleParty = fhirResponsiblePartyExtension
    ? fhirResponsiblePartyExtension.valueReference
    : fhirMedicationRequest.requester

  const fhirResponsiblePartyPractitionerRole = resolveReference(bundle, fhirResponsibleParty)

  responsibleParty.AgentPerson = convertPractitionerRoleFn(
    bundle,
    fhirResponsiblePartyPractitionerRole,
    convertAgentPersonPersonFn,
    getAgentPersonPersonIdFn
  )

  return responsibleParty
}

function convertPractitionerRole(
  bundle: fhir.Bundle,
  practitionerRole: fhir.PractitionerRole,
  convertAgentPersonPersonFn = convertAgentPersonPerson,
  getAgentPersonPersonIdFn = getAgentPersonPersonIdForAuthor
): hl7V3.AgentPerson {
  const fhirPractitioner = resolveReference(bundle, practitionerRole.practitioner)

  const hl7V3AgentPerson = createAgentPerson(
    practitionerRole,
    fhirPractitioner,
    convertAgentPersonPersonFn,
    getAgentPersonPersonIdFn
  )

  const fhirOrganization = resolveReference(bundle, practitionerRole.organization)

  let fhirHealthcareService: fhir.HealthcareService
  if (practitionerRole.healthcareService) {
    fhirHealthcareService = resolveReference(bundle, practitionerRole.healthcareService[0])
  }

  hl7V3AgentPerson.representedOrganization = convertOrganizationAndProviderLicense(
    bundle,
    fhirOrganization,
    fhirHealthcareService
  )

  return hl7V3AgentPerson
}

function createAgentPerson(
  practitionerRole: fhir.PractitionerRole,
  practitioner: fhir.Practitioner,
  convertAgentPersonPersonFn = convertAgentPersonPerson,
  getAgentPersonPersonIdFn = getAgentPersonPersonIdForAuthor
): hl7V3.AgentPerson {
  const hl7V3AgentPerson = new hl7V3.AgentPerson()

  const sdsRoleProfileIdentifier = getIdentifierValueForSystem(
    practitionerRole.identifier,
    "https://fhir.nhs.uk/Id/sds-role-profile-id",
    "PractitionerRole.identifier"
  )
  hl7V3AgentPerson.id = new hl7V3.SdsRoleProfileIdentifier(sdsRoleProfileIdentifier)

  const sdsJobRoleCode = getCodeableConceptCodingForSystem(
    practitionerRole.code,
    "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
    "PractitionerRole.code"
  )
  hl7V3AgentPerson.code = new hl7V3.SdsJobRoleCode(sdsJobRoleCode.code)

  hl7V3AgentPerson.telecom = getAgentPersonTelecom(practitionerRole.telecom, practitioner.telecom)

  hl7V3AgentPerson.agentPerson =
    convertAgentPersonPersonFn(
      practitionerRole,
      practitioner,
      getAgentPersonPersonIdFn)

  return hl7V3AgentPerson
}

export function getAgentPersonTelecom(
  fhirPractitionerRoleTelecom: Array<fhir.ContactPoint>,
  fhirPractitionerTelecom: Array<fhir.ContactPoint>
): Array<hl7V3.Telecom> {
  if (fhirPractitionerRoleTelecom !== undefined) {
    return fhirPractitionerRoleTelecom.map(telecom => convertTelecom(telecom, "PractitionerRole.telecom"))
  } else if (fhirPractitionerTelecom !== undefined) {
    return fhirPractitionerTelecom.map(telecom => convertTelecom(telecom, "Practitioner.telecom"))
  }
}

function convertAgentPersonPerson(
  practitionerRole: fhir.PractitionerRole,
  practitioner: fhir.Practitioner,
  getAgentPersonPersonIdFn = getAgentPersonPersonIdForAuthor) {
  const id = getAgentPersonPersonIdFn(practitioner.identifier, practitionerRole.identifier)
  const hl7V3AgentPersonPerson = new hl7V3.AgentPersonPerson(id)
  if (practitioner.name !== undefined) {
    hl7V3AgentPersonPerson.name = convertName(
      onlyElement(practitioner.name, "Practitioner.name"),
      "Practitioner.name"
    )
  }
  return hl7V3AgentPersonPerson
}

export function getAgentPersonPersonIdForAuthor(
  fhirPractitionerIdentifier: Array<fhir.Identifier>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fhirPractitionerRoleIdentifier: Array<fhir.Identifier> = []
): hl7V3.PrescriptionAuthorId {
  const professionalCode: Array<hl7V3.ProfessionalCode> = []

  let gmcCode = getIdentifierValueOrNullForSystem(
    fhirPractitionerIdentifier,
    "https://fhir.hl7.org.uk/Id/gmc-number",
    "Practitioner.identifier"
  )
  if (gmcCode) {
    if(gmcCode.toUpperCase().startsWith("C")) {
      gmcCode = gmcCode.substring(1)
    }
    professionalCode.push(new hl7V3.ProfessionalCode(gmcCode))
  }

  const gmpCode = getIdentifierValueOrNullForSystem(
    fhirPractitionerIdentifier,
    "https://fhir.hl7.org.uk/Id/gmp-number",
    "Practitioner.identifier"
  )
  if (gmpCode) {
    professionalCode.push(new hl7V3.ProfessionalCode(gmpCode))
  }

  const nmcCode = getIdentifierValueOrNullForSystem(
    fhirPractitionerIdentifier,
    "https://fhir.hl7.org.uk/Id/nmc-number",
    "Practitioner.identifier"
  )
  if (nmcCode) {
    professionalCode.push(new hl7V3.ProfessionalCode(nmcCode))
  }

  const gphcCode = getIdentifierValueOrNullForSystem(
    fhirPractitionerIdentifier,
    "https://fhir.hl7.org.uk/Id/gphc-number",
    "Practitioner.identifier"
  )
  if (gphcCode) {
    professionalCode.push(new hl7V3.ProfessionalCode(gphcCode))
  }

  const hcpcCode = getIdentifierValueOrNullForSystem(
    fhirPractitionerIdentifier,
    "https://fhir.hl7.org.uk/Id/hcpc-number",
    "Practitioner.identifier"
  )
  if (hcpcCode) {
    professionalCode.push(new hl7V3.ProfessionalCode(hcpcCode))
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
): hl7V3.PrescriptionAuthorId {

  const spuriousCode = getIdentifierValueOrNullForSystem(
    fhirPractitionerRoleIdentifier,
    "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
    "PractitionerRole.identifier"
  )
  if (spuriousCode) {
    return new hl7V3.PrescribingCode(spuriousCode)
  }

  const dinCode = getIdentifierValueOrNullForSystem(
    fhirPractitionerIdentifier,
    "https://fhir.hl7.org.uk/Id/din-number",
    "Practitioner.identifier"
  )
  if (dinCode) {
    return new hl7V3.PrescribingCode(dinCode)
  }

  return getAgentPersonPersonIdForAuthor(fhirPractitionerIdentifier)
}

function findRequesterSignature(
  bundle: fhir.Bundle,
  signatory: fhir.Reference<fhir.PractitionerRole>
) {
  const fhirProvenances = getProvenances(bundle)
  const requesterSignatures = fhirProvenances.flatMap(provenance => provenance.signature)
    .filter(signature => signature.who.reference === signatory.reference)
  return onlyElementOrNull(
    requesterSignatures,
    "Provenance.signature",
    `who.reference == '${signatory.reference}'`
  )
}

import {convertName, convertTelecom} from "./demographics"
import {
  getExtensionForUrlOrNull,
  getIdentifierValueForSystem,
  getIdentifierValueOrNullForSystem,
  identifyMessageType,
  onlyElement,
  onlyElementOrNull,
  resolveHealthcareService,
  resolveOrganization,
  resolvePractitioner,
  resolveReference
} from "../common"
import * as XmlJs from "xml-js"
import {convertOrganizationAndProviderLicense} from "./organization"
import {getProvenances} from "../common/getResourcesOfType"
import {hl7V3, fhir, processingErrors as errors} from "@models"
import moment from "moment"
import {convertIsoDateTimeStringToHl7V3DateTime, convertMomentToHl7V3DateTime} from "../common/dateTime"
import {getJobRoleCodeOrName} from "./job-role-code"
import {isReference} from "../../../utils/type-guards"

export function convertAuthor(
  bundle: fhir.Bundle,
  firstMedicationRequest: fhir.MedicationRequest
): hl7V3.PrescriptionAuthor {
  const author = new hl7V3.PrescriptionAuthor()
  if (identifyMessageType(bundle) !== fhir.EventCodingCode.CANCELLATION) {
    const requesterSignature = findRequesterSignature(bundle, firstMedicationRequest.requester)
    setSignatureTimeAndText(author, requesterSignature)
  }
  const requesterPractitionerRole = resolveReference(bundle, firstMedicationRequest.requester)
  author.AgentPerson = convertPractitionerRole(bundle, requesterPractitionerRole)
  return author
}

function setSignatureTimeAndText(author: hl7V3.PrescriptionAuthor, requesterSignature?: fhir.Signature) {
  if (requesterSignature) {
    author.time = convertIsoDateTimeStringToHl7V3DateTime(requesterSignature.when, "Provenance.signature.when")
    try {
      const decodedSignatureData = Buffer.from(requesterSignature.data, "base64").toString("utf-8")
      author.signatureText = XmlJs.xml2js(decodedSignatureData, {compact: true})
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      throw new errors.InvalidValueError("Invalid signature format.", "Provenance.signature.data")
    }
  } else {
    author.time = convertMomentToHl7V3DateTime(moment.utc())
    author.signatureText = hl7V3.Null.NOT_APPLICABLE
  }
}

export function convertResponsibleParty(
  bundle: fhir.Bundle,
  medicationRequest: fhir.MedicationRequest
): hl7V3.PrescriptionResponsibleParty {
  const responsibleParty = new hl7V3.PrescriptionResponsibleParty()

  const responsiblePartyExtension = getExtensionForUrlOrNull(
    medicationRequest.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner",
    "MedicationRequest.extension"
  ) as fhir.ReferenceExtension<fhir.PractitionerRole>

  const responsiblePartyReference = responsiblePartyExtension
    ? responsiblePartyExtension.valueReference
    : medicationRequest.requester

  const resolvedPractitionerRole = resolveReference(bundle, responsiblePartyReference)
  const responsiblePartyPractitionerRole
    = hydrateOrgOnlyResponsibleParty(bundle, resolvedPractitionerRole)

  responsibleParty.AgentPerson = convertPractitionerRole(
    bundle,
    responsiblePartyPractitionerRole,
    getAgentPersonPersonIdForResponsibleParty
  )

  return responsibleParty
}

/**
 * In the case of an org only responsible party, the org reference is used to resolve the organization's name
 * and populate the practitioner name.
 */
function hydrateOrgOnlyResponsibleParty(
  bundle: fhir.Bundle,
  practitionerRole: fhir.PractitionerRole
): fhir.PractitionerRole {
  const orgIsReference = practitionerRole.organization && isReference(practitionerRole.organization)
  const practitionerIsReference = isReference(practitionerRole.practitioner)
  const isOrgOnlyResponsibleParty = orgIsReference && !practitionerIsReference
  if (!isOrgOnlyResponsibleParty) {
    return practitionerRole
  }

  const organizationReference = practitionerRole.organization as fhir.Reference<fhir.Organization>
  const organization = resolveReference(bundle, organizationReference)
  const organizationName = organization.name

  const practitionerIdentifier = practitionerRole.practitioner as fhir.IdentifierReference<fhir.Practitioner>
  const newPractitioner: fhir.IdentifierReference<fhir.Practitioner> = {
    identifier: practitionerIdentifier.identifier,
    display: organizationName
  }

  return {
    ...practitionerRole,
    practitioner: newPractitioner
  }
}

export function convertPractitionerRole(
  bundle: fhir.Bundle,
  practitionerRole: fhir.PractitionerRole,
  getAgentPersonPersonIdFn = getAgentPersonPersonIdForAuthor
): hl7V3.AgentPerson {
  let practitioner: fhir.Practitioner
  if(practitionerRole.practitioner)
    practitioner = resolvePractitioner(bundle, practitionerRole.practitioner)

  const organization = resolveOrganization(bundle, practitionerRole)

  const telecom = getAgentPersonTelecom(practitionerRole, practitioner, organization)
  const agentPerson = createAgentPerson(
    practitionerRole,
    practitioner,
    telecom,
    getAgentPersonPersonIdFn
  )

  let healthcareService: fhir.HealthcareService
  if (practitionerRole.healthcareService) {
    healthcareService = resolveHealthcareService(bundle, practitionerRole)
  }

  agentPerson.representedOrganization = convertOrganizationAndProviderLicense(
    bundle,
    organization,
    healthcareService
  )

  return agentPerson
}

function createAgentPerson(
  practitionerRole: fhir.PractitionerRole,
  practitioner: fhir.Practitioner,
  telecom: Array<hl7V3.Telecom>,
  getAgentPersonPersonIdFn = getAgentPersonPersonIdForAuthor
): hl7V3.AgentPerson {
  const agentPerson = new hl7V3.AgentPerson()

  if(practitionerRole.identifier) {
    const sdsRoleProfileIdentifier = getIdentifierValueForSystem(
      practitionerRole.identifier,
      "https://fhir.nhs.uk/Id/sds-role-profile-id",
      "PractitionerRole.identifier"
    )
    agentPerson.id = new hl7V3.SdsRoleProfileIdentifier(sdsRoleProfileIdentifier)
  }

  if(practitionerRole.code) {
    const sdsJobRoleCode = getJobRoleCodeOrName(practitionerRole)
    agentPerson.code = new hl7V3.SdsJobRoleCode(sdsJobRoleCode.code)
  }

  agentPerson.telecom = telecom

  if(practitioner) {
    agentPerson.agentPerson =
    convertAgentPersonPerson(
      practitionerRole,
      practitioner,
      getAgentPersonPersonIdFn)
  }

  return agentPerson
}

export function getAgentPersonTelecom(
  practitionerRole: fhir.PractitionerRole,
  practitioner: fhir.Practitioner,
  organization: fhir.Organization
) : Array<hl7V3.Telecom> {
  const primaryTelecomSource: AgentPersonTelecomSource = {
    contactPoints: practitionerRole?.telecom,
    fhirPath: "PractitionerRole.telecom"
  }

  const practitionerIsResourceReference = isReference(practitionerRole?.practitioner)
  const secondaryTelecomSource: AgentPersonTelecomSource = practitionerIsResourceReference ?
    {
      contactPoints: practitioner?.telecom,
      fhirPath: "Practitioner.telecom"
    } :
    {
      contactPoints: organization?.telecom,
      fhirPath: "Organization.telecom"
    }

  return sourceAgentPersonTelecom(primaryTelecomSource, secondaryTelecomSource)
}

export interface AgentPersonTelecomSource{
  contactPoints: Array<fhir.ContactPoint>,
  fhirPath: string
}
export function sourceAgentPersonTelecom(
  practitionerRoleContactPoints: AgentPersonTelecomSource,
  secondaryContactPoints?: AgentPersonTelecomSource
): Array<hl7V3.Telecom> {
  if (practitionerRoleContactPoints?.contactPoints !== undefined) {
    return practitionerRoleContactPoints?.contactPoints.map(
      telecom => convertTelecom(telecom, practitionerRoleContactPoints.fhirPath)
    )
  }

  if (secondaryContactPoints?.contactPoints !== undefined){
    return secondaryContactPoints?.contactPoints?.map(
      telecom => convertTelecom(telecom, secondaryContactPoints.fhirPath)
    )
  }

  throw new errors.TooFewValuesError(
    "ResponsiblePractitioner must have at least one telecom.",
    practitionerRoleContactPoints.fhirPath
  )
}

function convertAgentPersonPerson(
  practitionerRole: fhir.PractitionerRole,
  practitioner: fhir.Practitioner,
  getAgentPersonPersonIdFn = getAgentPersonPersonIdForAuthor
): hl7V3.AgentPersonPerson {
  const id = getAgentPersonPersonIdFn(practitioner.identifier, practitionerRole.identifier)
  const agentPersonPerson = new hl7V3.AgentPersonPerson(id)
  if (practitioner.name !== undefined) {
    agentPersonPerson.name = convertName(
      onlyElement(practitioner.name, "Practitioner.name"),
      "Practitioner.name"
    )
  }
  return agentPersonPerson
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

  const unknownCode = getIdentifierValueOrNullForSystem(
    fhirPractitionerIdentifier,
    "https://fhir.hl7.org.uk/Id/professional-code",
    "Practitioner.identifier"
  )
  if (unknownCode) {
    professionalCode.push(new hl7V3.ProfessionalCode(unknownCode))
  }

  if (professionalCode.length === 1) {
    return professionalCode[0]
  }

  const error = "Expected exactly one professional code. One of GMC|GMP|NMC|GPhC|HCPC|unknown"
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
  const provenances = getProvenances(bundle)
  const requesterSignatures = provenances.flatMap(provenance => provenance.signature)
    .filter(signature => signature.who.reference === signatory.reference)
  return onlyElementOrNull(
    requesterSignatures,
    "Provenance.signature",
    `who.reference == '${signatory.reference}'`
  )
}

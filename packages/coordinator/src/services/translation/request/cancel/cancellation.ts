import moment from "moment"
import {convertPatient} from "../patient"
import {getMedicationRequests, getPatient} from "../../common/getResourcesOfType"
import * as common from "../../common"
import {
  getExtensionForUrl,
  getExtensionForUrlOrNull,
  getIdentifierValueForSystem,
  getMessageId,
  onlyElement,
  resolveHealthcareService,
  resolveOrganization,
  resolvePractitioner,
  resolveReference
} from "../../common"
import {fhir, hl7V3} from "@models"
import {convertMomentToHl7V3DateTime} from "../../common/dateTime"
import {SdsUniqueIdentifier} from "../../../../../../models/hl7-v3"
import {convertOrganizationAndProviderLicense} from "../organization"
import {convertName, convertTelecom} from "../demographics"
import {getJobRoleCodeOrName} from "../job-role-code"
import {Logger} from "pino"

export function convertCancellation(
  bundle: fhir.Bundle,
  logger: Logger,
  convertPatientFn = convertPatient
): hl7V3.CancellationRequest {
  const fhirFirstMedicationRequest = getMedicationRequests(bundle)[0]
  const effectiveTime = convertMomentToHl7V3DateTime(moment.utc())

  const messageId = getMessageId([bundle.identifier], "Bundle.identifier")

  const cancellationRequest = new hl7V3.CancellationRequest(
    new hl7V3.GlobalIdentifier(messageId), effectiveTime
  )

  const fhirPatient = getPatient(bundle)
  const hl7V3Patient = convertPatientFn(bundle, fhirPatient, logger)
  cancellationRequest.recordTarget = new hl7V3.RecordTarget(hl7V3Patient)

  const hl7V3CancelRequester = convertAuthor(bundle, fhirFirstMedicationRequest)
  cancellationRequest.author = new hl7V3.Author()
  cancellationRequest.author.AgentPerson = hl7V3CancelRequester.AgentPerson

  const hl7V3OriginalPrescriptionAuthor = convertResponsibleParty(bundle, fhirFirstMedicationRequest)
  cancellationRequest.responsibleParty = new hl7V3.ResponsibleParty()
  cancellationRequest.responsibleParty.AgentPerson = hl7V3OriginalPrescriptionAuthor.AgentPerson

  cancellationRequest.pertinentInformation2 = new hl7V3.CancellationRequestPertinentInformation2(
    fhirFirstMedicationRequest.groupIdentifier.value
  )

  const lineItemToCancel = getIdentifierValueForSystem(
    fhirFirstMedicationRequest.identifier,
    "https://fhir.nhs.uk/Id/prescription-order-item-number",
    "MedicationRequest.identifier"
  )
  cancellationRequest.pertinentInformation1 = new hl7V3.CancellationRequestPertinentInformation1(lineItemToCancel)

  const statusReason = common.getCodingForSystem(
    fhirFirstMedicationRequest.statusReason.coding,
    "https://fhir.nhs.uk/CodeSystem/medicationrequest-status-reason",
    "MedicationRequest.statusReason")
  cancellationRequest.pertinentInformation = new hl7V3.CancellationRequestPertinentInformation(
    statusReason.code,
    statusReason.display
  )

  const prescriptionToCancel = getExtensionForUrl(
    fhirFirstMedicationRequest.groupIdentifier.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
    "MedicationRequest.groupIdentifier.extension"
  ) as fhir.IdentifierExtension
  cancellationRequest.pertinentInformation3 = new hl7V3.CancellationRequestPertinentInformation3(
    prescriptionToCancel.valueIdentifier.value
  )

  return cancellationRequest
}

export function convertAuthor(
  bundle: fhir.Bundle,
  firstMedicationRequest: fhir.MedicationRequest
): hl7V3.PrescriptionAuthor {
  const author = new hl7V3.PrescriptionAuthor()

  const requesterPractitionerRole = resolveReference(bundle, firstMedicationRequest.requester)
  author.AgentPerson = convertPractitionerRole(bundle, requesterPractitionerRole)
  return author
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

  const responsiblePartyPractitionerRole = resolveReference(bundle, responsiblePartyReference)

  responsibleParty.AgentPerson = convertPractitionerRole(
    bundle,
    responsiblePartyPractitionerRole
  )

  return responsibleParty
}

function convertPractitionerRole(
  bundle: fhir.Bundle,
  practitionerRole: fhir.PractitionerRole
): hl7V3.AgentPerson {

  let practitioner: fhir.Practitioner
  if(practitionerRole.practitioner)
    practitioner = resolvePractitioner(bundle, practitionerRole.practitioner)

  const agentPerson = createAgentPerson(
    practitionerRole,
    practitioner
  )

  const organization = resolveOrganization(bundle, practitionerRole)

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
  practitioner: fhir.Practitioner
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

  if(practitioner)
    agentPerson.telecom = getAgentPersonTelecom(practitionerRole.telecom, practitioner.telecom)
  else if(practitionerRole.telecom)
    agentPerson.telecom = getAgentPersonTelecom(practitionerRole.telecom)

  if(practitioner)
    agentPerson.agentPerson = convertAgentPersonPerson(practitioner)

  return agentPerson
}

function convertAgentPersonPerson(
  practitioner: fhir.Practitioner
): hl7V3.AgentPersonPerson {
  const id = getAgentPersonPersonId(practitioner.identifier)
  const agentPersonPerson = new hl7V3.AgentPersonPerson(id)
  if (practitioner.name !== undefined) {
    agentPersonPerson.name = convertName(
      onlyElement(practitioner.name, "Practitioner.name"),
      "Practitioner.name"
    )
  }
  return agentPersonPerson
}

export function getAgentPersonPersonId(
  fhirPractitionerIdentifier: Array<fhir.Identifier>
): hl7V3.PrescriptionDispenseAuthorId {
  const sdsId = getIdentifierValueForSystem(
    fhirPractitionerIdentifier,
    "https://fhir.nhs.uk/Id/sds-user-id",
    "Practitioner.identifier")
  return new SdsUniqueIdentifier(sdsId)
}

export function getAgentPersonTelecom(
  practitionerRoleContactPoints: Array<fhir.ContactPoint>,
  practitionerContactPoints?: Array<fhir.ContactPoint>
): Array<hl7V3.Telecom> {
  if (practitionerRoleContactPoints !== undefined) {
    return practitionerRoleContactPoints.map(telecom => convertTelecom(telecom, "PractitionerRole.telecom"))
  } else if (practitionerContactPoints !== undefined) {
    return practitionerContactPoints.map(telecom => convertTelecom(telecom, "Practitioner.telecom"))
  }
}

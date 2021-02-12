import {
  NominatedPrescriptionReleaseRequest,
  NominatedPrescriptionReleaseRequestWrapper
} from "../../../models/hl7-v3/hl7-v3-dispense"
import * as core from "../../../models/hl7-v3/hl7-v3-datatypes-core"
import * as codes from "../../../models/hl7-v3/hl7-v3-datatypes-codes"
import * as uuid from "uuid"
import {AgentPerson, AgentPersonPerson, Organization} from "../../../models/hl7-v3/hl7-v3-people-places"
import * as fhir from "../../../models/fhir/fhir-resources"

export function translateReleaseRequest(
  fhirReleaseRequest: fhir.Parameters
): NominatedPrescriptionReleaseRequestWrapper {
  const hl7Id = new codes.GlobalIdentifier(uuid.v4())
  const timestamp = new core.Timestamp("")
  const hl7Release = new NominatedPrescriptionReleaseRequest(hl7Id, timestamp)
  hl7Release.author = getAuthor(fhirReleaseRequest)
  return new NominatedPrescriptionReleaseRequestWrapper(hl7Release)
}

function getAuthor(fhirReleaseRequest: fhir.Parameters): core.SendMessagePayloadAuthorAgentPerson {
  const hl7AgentPerson = new AgentPerson()
  hl7AgentPerson.id = new codes.SdsRoleProfileIdentifier("100102238986")
  hl7AgentPerson.code = new codes.SdsJobRoleCode("R8000")
  hl7AgentPerson.telecom = [new core.Telecom(core.TelecomUse.WORKPLACE, "01234567890")]

  hl7AgentPerson.agentPerson = getAgentPersonPerson()

  hl7AgentPerson.representedOrganization = getRepresentedOrganization(fhirReleaseRequest)

  return new core.SendMessagePayloadAuthorAgentPerson(hl7AgentPerson)
}

function getAgentPersonPerson(): AgentPersonPerson {
  const agentPerson = new AgentPersonPerson(new codes.ProfessionalCode("G9999999"))

  const agentPersonPersonName = new core.Name()
  agentPersonPersonName.prefix = new core.Text("DR")
  agentPersonPersonName.given = new core.Text("Thomas")
  agentPersonPersonName.family = new core.Text("Edwards")

  agentPerson.name = agentPersonPersonName
  return agentPerson
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getRepresentedOrganization(fhirReleaseRequest: fhir.Parameters): Organization {
  const hl7Organization = new Organization()

  const organizationCode = (fhirReleaseRequest.parameter[0] as fhir.IdentifierParameter).valueIdentifier.value
  hl7Organization.id = new codes.SdsOrganizationIdentifier(organizationCode)
  hl7Organization.code = new codes.OrganizationTypeCode("999")
  hl7Organization.name = new core.Text("SOMERSET BOWEL CANCER SCREENING CENTRE")
  hl7Organization.telecom = new core.Telecom(core.TelecomUse.WORKPLACE, "01823333444")

  const address = new core.Address(core.AddressUse.WORK)
  address.streetAddressLine = [
    new core.Text("MUSGROVE PARK HOSPITAL"),
    new core.Text("TAUNTON")
  ]
  address.postalCode = new core.Text("TA1 5DA")

  hl7Organization.addr = address
  return hl7Organization
}

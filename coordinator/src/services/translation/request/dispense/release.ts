import * as hl7v3 from "../../../../models/hl7-v3"
import * as uuid from "uuid"
import * as fhir from "../../../../models/fhir"
import {getIdentifierParameterByName} from "../../common"
import {convertMomentToHl7V3DateTime} from "../../common/dateTime"
import moment from "moment"

export function translateReleaseRequest(
  fhirReleaseRequest: fhir.Parameters
): hl7v3.NominatedPrescriptionReleaseRequestWrapper {
  const hl7Id = new hl7v3.GlobalIdentifier(uuid.v4())
  const timestamp = convertMomentToHl7V3DateTime(moment.utc())
  const hl7Release = new hl7v3.NominatedPrescriptionReleaseRequest(hl7Id, timestamp)
  hl7Release.author = getAuthor(fhirReleaseRequest)
  return new hl7v3.NominatedPrescriptionReleaseRequestWrapper(hl7Release)
}

function getAuthor(fhirReleaseRequest: fhir.Parameters): hl7v3.SendMessagePayloadAuthorAgentPerson {
  const hl7AgentPerson = new hl7v3.AgentPerson()
  hl7AgentPerson.id = new hl7v3.SdsRoleProfileIdentifier("100102238986")
  hl7AgentPerson.code = new hl7v3.SdsJobRoleCode("R8000")
  hl7AgentPerson.telecom = [new hl7v3.Telecom(hl7v3.TelecomUse.WORKPLACE, "01234567890")]

  hl7AgentPerson.agentPerson = getAgentPersonPerson()

  hl7AgentPerson.representedOrganization = getRepresentedOrganization(fhirReleaseRequest)

  return new hl7v3.SendMessagePayloadAuthorAgentPerson(hl7AgentPerson)
}

function getAgentPersonPerson(): hl7v3.AgentPersonPerson {
  const agentPerson = new hl7v3.AgentPersonPerson(new hl7v3.ProfessionalCode("G9999999"))

  const agentPersonPersonName = new hl7v3.Name()
  agentPersonPersonName.prefix = new hl7v3.Text("DR")
  agentPersonPersonName.given = new hl7v3.Text("Thomas")
  agentPersonPersonName.family = new hl7v3.Text("Edwards")

  agentPerson.name = agentPersonPersonName
  return agentPerson
}

function getRepresentedOrganization(fhirReleaseRequest: fhir.Parameters): hl7v3.Organization {
  const hl7Organization = new hl7v3.Organization()

  const organizationParameter = getIdentifierParameterByName(fhirReleaseRequest.parameter, "owner")
  const organizationCode = organizationParameter.valueIdentifier.value
  hl7Organization.id = new hl7v3.SdsOrganizationIdentifier(organizationCode)
  hl7Organization.code = new hl7v3.OrganizationTypeCode("999")
  hl7Organization.name = new hl7v3.Text("SOMERSET BOWEL CANCER SCREENING CENTRE")
  hl7Organization.telecom = new hl7v3.Telecom(hl7v3.TelecomUse.WORKPLACE, "01823333444")

  const address = new hl7v3.Address(hl7v3.AddressUse.WORK)
  address.streetAddressLine = [
    new hl7v3.Text("MUSGROVE PARK HOSPITAL"),
    new hl7v3.Text("TAUNTON")
  ]
  address.postalCode = new hl7v3.Text("TA1 5DA")

  hl7Organization.addr = address
  return hl7Organization
}

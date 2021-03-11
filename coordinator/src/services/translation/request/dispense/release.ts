import * as hl7v3 from "../../../../models/hl7-v3"
import * as uuid from "uuid"
import * as fhir from "../../../../models/fhir"
import {getIdentifierParameterByName, getIdentifierValueForSystem} from "../../common"
import {convertMomentToHl7V3DateTime} from "../../common/dateTime"
import moment from "moment"
import {odsClient} from "../../../communication/ods-client"
import pino from "pino"
import {InvalidValueError} from "../../../../models/errors/processing-errors"
import * as hl7V3 from "../../../../models/hl7-v3"
import {convertAddress, convertTelecom} from "../demographics"

export async function translateReleaseRequest(
  fhirReleaseRequest: fhir.Parameters,
  logger: pino.Logger
): Promise<hl7v3.NominatedPrescriptionReleaseRequestWrapper> {
  const organizationParameter = getIdentifierParameterByName(fhirReleaseRequest.parameter, "owner")
  const organizationCode = organizationParameter.valueIdentifier.value

  const hl7Id = new hl7v3.GlobalIdentifier(uuid.v4())
  const timestamp = convertMomentToHl7V3DateTime(moment.utc())
  const hl7Release = new hl7v3.NominatedPrescriptionReleaseRequest(hl7Id, timestamp)
  hl7Release.author = await getAuthor(organizationCode, logger)
  return new hl7v3.NominatedPrescriptionReleaseRequestWrapper(hl7Release)
}

async function getAuthor(
  organizationCode: string,
  logger: pino.Logger
): Promise<hl7v3.SendMessagePayloadAuthorAgentPerson> {
  //TODO - replace all user details with values which are obviously placeholders
  const hl7AgentPerson = new hl7v3.AgentPerson()
  hl7AgentPerson.id = new hl7v3.SdsRoleProfileIdentifier("100102238986")
  hl7AgentPerson.code = new hl7v3.SdsJobRoleCode("R8000")
  const telecom = new hl7v3.Telecom()
  telecom._attributes = {
    use: hl7v3.TelecomUse.WORKPLACE,
    value: "tel:01234567890"
  }
  hl7AgentPerson.telecom = [telecom]

  hl7AgentPerson.agentPerson = getAgentPersonPerson()

  hl7AgentPerson.representedOrganization = await getRepresentedOrganization(organizationCode, logger)

  return new hl7v3.SendMessagePayloadAuthorAgentPerson(hl7AgentPerson)
}

function getAgentPersonPerson(): hl7v3.AgentPersonPerson {
  //TODO - replace all user details with values which are obviously placeholders
  const agentPerson = new hl7v3.AgentPersonPerson(new hl7v3.ProfessionalCode("G9999999"))

  const agentPersonPersonName = new hl7v3.Name()
  agentPersonPersonName.prefix = new hl7v3.Text("DR")
  agentPersonPersonName.given = new hl7v3.Text("Thomas")
  agentPersonPersonName.family = new hl7v3.Text("Edwards")

  agentPerson.name = agentPersonPersonName
  return agentPerson
}

async function getRepresentedOrganization(
  organizationCode: string,
  logger: pino.Logger
): Promise<hl7v3.Organization> {
  const organization = await odsClient.lookupOrganization(organizationCode, logger)
  if (!organization) {
    throw new InvalidValueError(
      `No organisation details found for code ${organizationCode}`,
      "Parameters.parameter"
    )
  }
  return convertOrganization(organization)
}

function convertOrganization(organization: fhir.Organization): hl7v3.Organization {
  const hl7V3Organization = new hl7V3.Organization()
  const organizationSdsId = getIdentifierValueForSystem(
    organization.identifier,
    "https://fhir.nhs.uk/Id/ods-organization-code",
    `Organization.identifier`
  )
  hl7V3Organization.id = new hl7V3.SdsOrganizationIdentifier(organizationSdsId)
  hl7V3Organization.code = new hl7V3.OrganizationTypeCode("999")
  if (organization.name) {
    hl7V3Organization.name = new hl7v3.Text(organization.name)
  }
  if (organization.telecom?.length) {
    hl7V3Organization.telecom = convertTelecom(organization.telecom[0], "Organization.telecom")
  }
  if (organization.address?.length) {
    hl7V3Organization.addr = convertAddress(organization.address[0], "Organization.address")
  }
  return hl7V3Organization
}

import * as hl7v3 from "../../../../models/hl7-v3"
import * as uuid from "uuid"
import * as fhir from "../../../../models/fhir"
import {getIdentifierParameterByName} from "../../common"
import {convertMomentToHl7V3DateTime} from "../../common/dateTime"
import moment from "moment"
import {odsClient} from "../../../communication/ods-client"
import pino from "pino"
import {convertRepresentedOrganization} from "../organization"
import {InvalidValueError} from "../../../../models/errors/processing-errors"

export async function translateReleaseRequest(
  fhirReleaseRequest: fhir.Parameters,
  logger: pino.Logger
): Promise<hl7v3.NominatedPrescriptionReleaseRequestWrapper> {
  const hl7Id = new hl7v3.GlobalIdentifier(uuid.v4())
  const timestamp = convertMomentToHl7V3DateTime(moment.utc())
  const hl7Release = new hl7v3.NominatedPrescriptionReleaseRequest(hl7Id, timestamp)
  hl7Release.author = await getAuthor(fhirReleaseRequest, logger)
  return new hl7v3.NominatedPrescriptionReleaseRequestWrapper(hl7Release)
}

async function getAuthor(
  fhirReleaseRequest: fhir.Parameters,
  logger: pino.Logger
): Promise<hl7v3.SendMessagePayloadAuthorAgentPerson> {
  const hl7AgentPerson = new hl7v3.AgentPerson()
  hl7AgentPerson.id = new hl7v3.SdsRoleProfileIdentifier("100102238986")
  hl7AgentPerson.code = new hl7v3.SdsJobRoleCode("R8000")
  hl7AgentPerson.telecom = [new hl7v3.Telecom(hl7v3.TelecomUse.WORKPLACE, "01234567890")]

  hl7AgentPerson.agentPerson = getAgentPersonPerson()

  hl7AgentPerson.representedOrganization = await getRepresentedOrganization(fhirReleaseRequest, logger)

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

async function getRepresentedOrganization(
  fhirReleaseRequest: fhir.Parameters,
  logger: pino.Logger
): Promise<hl7v3.Organization> {
  const organizationParameter = getIdentifierParameterByName(fhirReleaseRequest.parameter, "owner")
  const organizationCode = organizationParameter.valueIdentifier.value
  const organization = await odsClient.lookupOrganization(organizationCode, logger)
  if (!organization) {
    throw new InvalidValueError(
      `No organisation details found for code ${organizationCode}`,
      "Parameters.parameter"
    )
  }
  ensureRequiredFields(organization)
  return convertRepresentedOrganization(organization, null, null)
}

/**
 * TODO - work out what to do about missing fields in ODS records
 */
function ensureRequiredFields(organization: fhir.Organization) {
  if (!organization.name) {
    organization.name = "UNKNOWN"
  }
  if (!organization.telecom?.length) {
    organization.telecom = [{
      use: "work",
      system: "phone",
      value: "UNKNOWN"
    }]
  }
  organization.telecom.forEach(telecom => {
    if (!telecom.use) {
      telecom.use = "work"
    }
  })
  if (!organization.address?.length) {
    organization.address = [{
      use: "work",
      line: ["UNKNOWN"]
    }]
  }
  organization.address.forEach(address => {
    if (!address.use) {
      address.use = "work"
    }
  })
}

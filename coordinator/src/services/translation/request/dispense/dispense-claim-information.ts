import {fhir, hl7V3} from "@models"
import moment from "moment"
import pino from "pino"
import {
  DispenseClaimPertinentSupplyHeader,
  LegalAuthenticator,
  PrimaryInformationRecipient,
  Timestamp
} from "../../../../../../models/hl7-v3"
import {getExtensionForUrl, getMedicationCoding, getMessageId} from "../../common"
import {convertMomentToHl7V3DateTime} from "../../common/dateTime"
import {getMedicationDispenses, getMessageHeader} from "../../common/getResourcesOfType"
import {createAgentPersonForUnattendedAccess} from "../agent-unattended"
import {
  createAgentOrganisation,
  createPertinentInformation1LineItem,
  createPertinentPrescriptionId,
  createPertinentPrescriptionStatus,
  createPriorOriginalRef,
  createPriorPrescriptionReleaseEventRef,
  getOrganisationPerformer,
  getRepeatNumberFromRepeatInfoExtension,
  isRepeatDispensing
} from "./dispense-common"

export async function convertDispenseClaimInformation(
  bundle: fhir.Bundle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logger: pino.Logger
): Promise<hl7V3.DispenseClaimInformation> {
  const messageId = getMessageId([bundle.identifier], "Bundle.identifier")
  const fhirHeader = getMessageHeader(bundle)

  const now = convertMomentToHl7V3DateTime(moment.utc())

  const hl7DispenseClaimInformation = new hl7V3.DispenseClaimInformation(
    new hl7V3.GlobalIdentifier(messageId),
    now
  )

  const fhirMedicationDispenses = getMedicationDispenses(bundle)
  const fhirFirstMedicationDispense = fhirMedicationDispenses[0]

  const fhirOrganisationPerformer = getOrganisationPerformer(fhirFirstMedicationDispense)
  const hl7PertinentInformation1 = await createPertinentInformation1(
    bundle,
    messageId,
    now,
    fhirOrganisationPerformer,
    fhirMedicationDispenses,
    fhirFirstMedicationDispense,
    logger
  )

  hl7DispenseClaimInformation.pertinentInformation1 = hl7PertinentInformation1

  const hl7PriorPrescriptionReleaseEventRef = createPriorPrescriptionReleaseEventRef(fhirHeader)
  hl7DispenseClaimInformation.sequelTo = new hl7V3.SequelTo(hl7PriorPrescriptionReleaseEventRef)

  const hl7AgentOrganisation = createAgentOrganisation(fhirOrganisationPerformer)

  hl7DispenseClaimInformation.primaryInformationRecipient = new PrimaryInformationRecipient(hl7AgentOrganisation)

  return hl7DispenseClaimInformation
}

async function createPertinentInformation1(
  bundle: fhir.Bundle,
  messageId: string,
  timestamp: Timestamp,
  fhirOrganisation: fhir.DispensePerformer,
  fhirMedicationDispenses: Array<fhir.MedicationDispense>,
  fhirFirstMedicationDispense: fhir.MedicationDispense,
  logger: pino.Logger
) {

  const hl7PertinentPrescriptionStatus = createPertinentPrescriptionStatus(fhirFirstMedicationDispense)
  const hl7PertinentPrescriptionIdentifier = createPertinentPrescriptionId(fhirFirstMedicationDispense)
  const hl7PriorOriginalRef = createPriorOriginalRef(fhirFirstMedicationDispense)

  const hl7PertinentInformation1LineItems = fhirMedicationDispenses.map(
    medicationDispense => {
      return createPertinentInformation1LineItem(
        medicationDispense,
        getMedicationCoding(bundle, medicationDispense),
        logger
      )
    }
  )

  const hl7RepresentedOrganisationCode = fhirOrganisation.actor.identifier.value
  // TODO - Unattended access?
  const agentPerson = await createAgentPersonForUnattendedAccess(hl7RepresentedOrganisationCode, logger)
  const legalAuthenticator = new LegalAuthenticator(agentPerson, timestamp)
  const supplyHeader = new DispenseClaimPertinentSupplyHeader(new hl7V3.GlobalIdentifier(messageId), legalAuthenticator)
  supplyHeader.pertinentInformation1 = hl7PertinentInformation1LineItems
  supplyHeader.pertinentInformation3 = new hl7V3.DispensePertinentInformation3(hl7PertinentPrescriptionStatus)
  supplyHeader.pertinentInformation4 = new hl7V3.DispensePertinentInformation4(hl7PertinentPrescriptionIdentifier)
  supplyHeader.inFulfillmentOf = new hl7V3.InFulfillmentOf(hl7PriorOriginalRef)

  if (isRepeatDispensing(fhirFirstMedicationDispense)) {
    const repeatInfo = getExtensionForUrl(
      fhirFirstMedicationDispense.extension,
      "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation",
      "MedicationDispense.extension"
    ) as fhir.ExtensionExtension<fhir.IntegerExtension>

    supplyHeader.repeatNumber = getRepeatNumberFromRepeatInfoExtension(repeatInfo)
  }

  return new hl7V3.DispensePertinentInformation1(supplyHeader)
}

import {fhir, hl7V3} from "@models"
import {LosslessNumber} from "lossless-json"
import {getExtensionForUrl, getNumericValueAsString} from "../../common"
import {OrganisationTypeCode} from "../../common/organizationTypeCode"

export function createAgentOrganisationFromReference(
  reference: fhir.IdentifierReference<fhir.PersonOrOrganization>
): hl7V3.AgentOrganization {
  const organisationCode = reference.identifier.value
  const organisationName = reference.display
  const hl7Organisation = createOrganisation(organisationCode, organisationName)
  return new hl7V3.AgentOrganization(hl7Organisation)
}

export function createOrganisation(organisationCode: string, organisationName: string): hl7V3.Organization {
  const organisation = new hl7V3.Organization()
  organisation.id = new hl7V3.SdsOrganizationIdentifier(organisationCode)
  organisation.code = new hl7V3.OrganizationTypeCode(OrganisationTypeCode.NOT_SPECIFIED)
  organisation.name = new hl7V3.Text(organisationName)
  return organisation
}

export function createPriorPrescriptionReleaseEventRef(
  fhirHeader: fhir.MessageHeader
): hl7V3.PriorPrescriptionReleaseEventRef {
  return new hl7V3.PriorPrescriptionReleaseEventRef(
    new hl7V3.GlobalIdentifier(fhirHeader.response.identifier)
  )
}

export function getRepeatNumberFromRepeatInfoExtension(
  repeatInfoExtension: fhir.ExtensionExtension<fhir.IntegerExtension>,
  fhirPath: string,
  incrementRepeatsIssued = false,
  incrementRepeatsAllowed = false
): hl7V3.Interval<hl7V3.NumericValue> {
  const numberOfRepeatsIssuedExtension = getExtensionForUrl(
    repeatInfoExtension.extension,
    "numberOfRepeatsIssued",
    `${fhirPath}("https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation").extension`
  ) as fhir.IntegerExtension

  let numberOfRepeatsIssued = getNumericValueAsString(numberOfRepeatsIssuedExtension.valueInteger)
  if (incrementRepeatsIssued) {
    numberOfRepeatsIssued = (parseInt(numberOfRepeatsIssued) + 1).toString()
  }

  const numberOfRepeatsAllowedExtension = getExtensionForUrl(
    repeatInfoExtension.extension,
    "numberOfRepeatsAllowed",
    `${fhirPath}("https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation").extension`
  ) as fhir.IntegerExtension
  const numberOfRepeatsAllowed = parseNumberOfRepeatsAllowed(
    numberOfRepeatsAllowedExtension.valueInteger,
    incrementRepeatsAllowed
  )

  return new hl7V3.Interval<hl7V3.NumericValue>(
    new hl7V3.NumericValue(numberOfRepeatsIssued),
    new hl7V3.NumericValue(numberOfRepeatsAllowed)
  )
}

export function getPrescriptionNumberFromMedicationRepeatInfoExtension(
  medicationRepeatInfoExtension: fhir.ExtensionExtension<fhir.IntegerExtension>,
  fhirPath: string,
  numberOfRepeatsAllowed: string
): hl7V3.Interval<hl7V3.NumericValue> {
  const numberOfRepeatsIssuedExtension = getExtensionForUrl(
    medicationRepeatInfoExtension.extension,
    "numberOfPrescriptionsIssued",
    `${fhirPath}("https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation").extension`
  ) as fhir.UnsignedIntExtension
  const numberOfPrescriptionsIssued = getNumericValueAsString(numberOfRepeatsIssuedExtension.valueUnsignedInt)

  const incrementedNumberOfRepeatsAllowed = (parseInt(numberOfRepeatsAllowed) + 1).toString()

  return new hl7V3.Interval<hl7V3.NumericValue>(
    new hl7V3.NumericValue(numberOfPrescriptionsIssued),
    new hl7V3.NumericValue(incrementedNumberOfRepeatsAllowed)
  )
}

function parseNumberOfRepeatsAllowed(
  numberOfRepeatsAllowed: string | LosslessNumber,
  incrementRepeatsAllowed = false
): string {
  let numberOfRepeatsAllowedNumber = typeof numberOfRepeatsAllowed === "string"
    ? parseInt(numberOfRepeatsAllowed)
    : numberOfRepeatsAllowed.valueOf()
  if (typeof numberOfRepeatsAllowedNumber === "bigint") {
    numberOfRepeatsAllowedNumber = Number(numberOfRepeatsAllowedNumber)
  }

  if (incrementRepeatsAllowed) {
    const numberOfRepeatsAllowedFinal: string = (numberOfRepeatsAllowedNumber + 1).toString()
    return numberOfRepeatsAllowedFinal
  }

  return numberOfRepeatsAllowedNumber.toString()
}

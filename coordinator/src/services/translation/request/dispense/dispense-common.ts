import {fhir, hl7V3} from "@models"
import {getExtensionForUrl, getNumericValueAsString} from "../../common"

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
  organisation.code = new hl7V3.OrganizationTypeCode()
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
  fhirPath: string
): hl7V3.Interval<hl7V3.NumericValue> {
  const numberOfRepeatsIssuedExtension = getExtensionForUrl(
    repeatInfoExtension.extension,
    "numberOfRepeatsIssued",
    `${fhirPath}("https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation").extension`
  ) as fhir.IntegerExtension
  const numberOfRepeatsIssued = getNumericValueAsString(numberOfRepeatsIssuedExtension.valueInteger)
  const numberOfRepeatsAllowedExtension = getExtensionForUrl(
    repeatInfoExtension.extension,
    "numberOfRepeatsAllowed",
    `${fhirPath}("https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation").extension`
  ) as fhir.IntegerExtension
  const numberOfRepeatsAllowed = getNumericValueAsString(numberOfRepeatsAllowedExtension.valueInteger)

  return new hl7V3.Interval<hl7V3.NumericValue>(
    new hl7V3.NumericValue(numberOfRepeatsIssued),
    new hl7V3.NumericValue(numberOfRepeatsAllowed)
  )
}

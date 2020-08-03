import * as fhir from "../../model/fhir-resources"
import * as peoplePlaces from "../../model/hl7-v3-people-places"
import {getCodeableConceptCodingForSystem, getIdentifierValueForSystem, onlyElement, resolveReference} from "./common"
import * as codes from "../../model/hl7-v3-datatypes-codes"
import * as core from "../../model/hl7-v3-datatypes-core"
import {convertAddress, convertTelecom} from "./demographics"

export function convertOrganization(
    fhirBundle: fhir.Bundle,
    fhirOrganization: fhir.Organization,
    convertHealthCareProviderLicenseFn = convertHealthCareProviderLicense
): peoplePlaces.Organization {
    const hl7V3Organization = new peoplePlaces.Organization()

    const organizationSdsId = getIdentifierValueForSystem(fhirOrganization.identifier, "https://fhir.nhs.uk/Id/ods-organization-code")
    hl7V3Organization.id = new codes.SdsOrganizationIdentifier(organizationSdsId)

    if (fhirOrganization.type !== undefined) {
        const organizationTypeCoding = getCodeableConceptCodingForSystem(fhirOrganization.type, "urn:oid:2.16.840.1.113883.2.1.3.2.4.17.94")
        hl7V3Organization.code = new codes.OrganizationTypeCode(organizationTypeCoding.code)
    }

    if (fhirOrganization.name !== undefined) {
        hl7V3Organization.name = new core.Text(fhirOrganization.name)
    }

    if (fhirOrganization.telecom !== undefined) {
        hl7V3Organization.telecom = fhirOrganization.telecom.map(convertTelecom).reduce(onlyElement)
    }

    if (fhirOrganization.address !== undefined) {
        hl7V3Organization.addr = fhirOrganization.address.map(convertAddress).reduce(onlyElement)
    }

    if (fhirOrganization.partOf !== undefined) {
        hl7V3Organization.healthCareProviderLicense = convertHealthCareProviderLicenseFn(fhirBundle, fhirOrganization.partOf)
    }

    return hl7V3Organization
}

function convertHealthCareProviderLicense(
    bundle: fhir.Bundle,
    organizationPartOf: fhir.Reference<fhir.Organization>,
    convertOrganizationFn = convertOrganization
): peoplePlaces.HealthCareProviderLicense {
    const fhirParentOrganization = resolveReference(bundle, organizationPartOf)
    const hl7V3ParentOrganization = convertOrganizationFn(bundle, fhirParentOrganization)
    return new peoplePlaces.HealthCareProviderLicense(hl7V3ParentOrganization)
}

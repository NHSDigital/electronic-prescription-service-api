import * as XmlJs from 'xml-js'
import * as codes from "./hl7-v3-datatypes-codes"
import * as core from "./hl7-v3-datatypes-core"
import * as peoplePlaces from "./hl7-v3-people-places"
import * as prescriptions from "./hl7-v3-prescriptions"
import * as fhir from "./fhir-resources"
import * as crypto from "crypto-js"
import {Resource} from "./fhir-resources";

//TODO - is there a better way than returning Array<unknown>?
export function getResourcesOfType(fhirBundle: fhir.Bundle, resourceType: string): Array<unknown> {
    return fhirBundle.entry
        .map(entry => entry.resource)
        .filter(resource => resource.resourceType === resourceType)
}

export function getResourceForFullUrl(fhirBundle: fhir.Bundle, resourceFullUrl: string): Resource {
    return fhirBundle.entry
        .filter(entry => entry.fullUrl === resourceFullUrl)
        .reduce(onlyElement)
        .resource
}

export function getIdentifierValueForSystem(identifier: Array<fhir.Identifier>, system: string): string {
    return identifier
        .filter(identifier => identifier.system === system)
        .reduce(onlyElement)
        .value
}

function getCodingForSystem(coding: Array<fhir.Coding>, system: string) {
    return coding
        .filter(coding => coding.system === system)
        .reduce(onlyElement)
}

function getCodeableConceptCodingForSystem(codeableConcept: Array<fhir.CodeableConcept>, system: string) {
    const coding = codeableConcept
        .flatMap(codeableConcept => codeableConcept.coding);
    return getCodingForSystem(coding, system)
}

function convertBundleToParentPrescription(fhirBundle: fhir.Bundle) {
    const hl7V3ParentPrescription = new prescriptions.ParentPrescription()

    hl7V3ParentPrescription.id = new codes.GlobalIdentifier(fhirBundle.id)
    const fhirMedicationRequests = getResourcesOfType(fhirBundle, "MedicationRequest") as Array<fhir.MedicationRequest>
    const fhirFirstMedicationRequest = fhirMedicationRequests[0]
    hl7V3ParentPrescription.effectiveTime = new core.Timestamp(fhirFirstMedicationRequest.authoredOn)

    const fhirPatient = getResourceForFullUrl(fhirBundle, fhirFirstMedicationRequest.subject.reference)
    const hl7V3Patient = convertPatient(fhirBundle, fhirPatient)
    hl7V3ParentPrescription.recordTarget = new prescriptions.RecordTarget(hl7V3Patient)

    const hl7V3Prescription = convertBundleToPrescription(fhirBundle)
    hl7V3ParentPrescription.pertinentInformation1 = new prescriptions.ParentPrescriptionPertinentInformation1(hl7V3Prescription)

    return hl7V3ParentPrescription
}

function convertPatient(fhirBundle: fhir.Bundle, fhirPatient: fhir.Patient): peoplePlaces.Patient {
    const hl7V3Patient = new peoplePlaces.Patient()
    const nhsNumber = getIdentifierValueForSystem(fhirPatient.identifier, "https://fhir.nhs.uk/Id/nhs-number")
    hl7V3Patient.id = new codes.NhsNumber(nhsNumber)
    hl7V3Patient.addr = fhirPatient.address
        .map(convertAddress)

    const hl7V3PatientPerson = new peoplePlaces.PatientPerson()
    hl7V3PatientPerson.name = fhirPatient.name
        .map(convertName)
    hl7V3PatientPerson.administrativeGenderCode = convertGender(fhirPatient.gender)
    hl7V3PatientPerson.birthTime = new core.Timestamp(fhirPatient.birthDate)

    const fhirPractitionerRole = getResourceForFullUrl(fhirBundle, fhirPatient.generalPractitioner.reference) as fhir.PractitionerRole
    const fhirPractitioner = getResourceForFullUrl(fhirBundle, fhirPractitionerRole.practitioner.reference) as fhir.Practitioner
    const sdsUniqueId = getIdentifierValueForSystem(fhirPractitioner.identifier, "https://fhir.nhs.uk/Id/sds-user-id")
    const hl7V3HealthCareProvider = new peoplePlaces.HealthCareProvider()
    hl7V3HealthCareProvider.id = new codes.SdsUniqueIdentifier(sdsUniqueId)
    const hl7V3PatientCareProvision = new peoplePlaces.PatientCareProvision("1")
    hl7V3PatientCareProvision.responsibleParty = new peoplePlaces.ResponsibleParty(hl7V3HealthCareProvider)
    const hl7V3ProviderPatient = new peoplePlaces.ProviderPatient()
    hl7V3ProviderPatient.subjectOf = new peoplePlaces.SubjectOf(hl7V3PatientCareProvision)
    hl7V3PatientPerson.playedProviderPatient = hl7V3ProviderPatient

    hl7V3Patient.patientPerson = hl7V3PatientPerson

    return hl7V3Patient
}

function convertBundleToPrescription(fhirBundle: fhir.Bundle) {
    const hl7V3Prescription = new prescriptions.Prescription()

    const fhirMedicationRequests = getResourcesOfType(fhirBundle, "MedicationRequest") as Array<fhir.MedicationRequest>
    const fhirFirstMedicationRequest = fhirMedicationRequests[0]
    const prescriptionId = getIdentifierValueForSystem(fhirFirstMedicationRequest.groupIdentifier, "urn:uuid")
    const prescriptionShortFormId = getIdentifierValueForSystem(fhirFirstMedicationRequest.groupIdentifier, "urn:oid:2.16.840.1.113883.2.1.3.2.4.18.8")
    hl7V3Prescription.id = [
        new codes.GlobalIdentifier(prescriptionId),
        new codes.ShortFormPrescriptionIdentifier(prescriptionShortFormId)
    ]

    const hl7V3Author = new prescriptions.Author()
    hl7V3Author.time = new core.Timestamp(fhirFirstMedicationRequest.authoredOn)
    // TODO implement signatureText
    hl7V3Author.signatureText = core.Null.NOT_APPLICABLE
    const fhirAuthorPractitionerRole = getResourceForFullUrl(fhirBundle, fhirFirstMedicationRequest.requester.reference) as fhir.PractitionerRole
    hl7V3Author.AgentPerson = convertPractitionerRole(fhirBundle, fhirAuthorPractitionerRole)
    hl7V3Prescription.author = hl7V3Author

    const responsibleParty = new prescriptions.ResponsibleParty()
    const fhirPatient = getResourceForFullUrl(fhirBundle, fhirFirstMedicationRequest.subject.reference) as fhir.Patient
    const fhirResponsiblePartyPractitionerRole = getResourceForFullUrl(fhirBundle, fhirPatient.generalPractitioner.reference) as fhir.PractitionerRole
    responsibleParty.AgentPerson = convertPractitionerRole(fhirBundle, fhirResponsiblePartyPractitionerRole)
    hl7V3Prescription.responsibleParty = responsibleParty

    //TODO - implement
    const prescriptionTreatmentTypeValue = new codes.PrescriptionTreatmentTypeCode("0001");
    const prescriptionTreatmentType = new prescriptions.PrescriptionTreatmentType(prescriptionTreatmentTypeValue)
    hl7V3Prescription.pertinentInformation5 = new prescriptions.PrescriptionPertinentInformation5(prescriptionTreatmentType)

    //TODO - implement
    const dispensingSitePreferenceValue = new codes.DispensingSitePreferenceCode("0004");
    const dispensingSitePreference = new prescriptions.DispensingSitePreference(dispensingSitePreferenceValue)
    hl7V3Prescription.pertinentInformation1 = new prescriptions.PrescriptionPertinentInformation1(dispensingSitePreference)

    hl7V3Prescription.pertinentInformation2 = fhirMedicationRequests
        .map(convertMedicationRequestToLineItem)
        .map(hl7V3LineItem => new prescriptions.PrescriptionPertinentInformation2(hl7V3LineItem))

    //TODO - implement
    const tokenIssuedValue = new core.BooleanValue(true);
    const tokenIssued = new prescriptions.TokenIssued(tokenIssuedValue)
    hl7V3Prescription.pertinentInformation8 = new prescriptions.PrescriptionPertinentInformation8(tokenIssued)

    const fhirMedicationRequestCategoryCoding = getCodeableConceptCodingForSystem(fhirFirstMedicationRequest.category, "urn:oid:2.16.840.1.113883.2.1.3.2.4.17.25")
    const prescriptionTypeValue = new codes.PrescriptionTypeCode(fhirMedicationRequestCategoryCoding.code)
    const prescriptionType = new prescriptions.PrescriptionType(prescriptionTypeValue)
    hl7V3Prescription.pertinentInformation4 = new prescriptions.PrescriptionPertinentInformation4(prescriptionType)

    return hl7V3Prescription
}

function convertMedicationRequestToLineItem(fhirMedicationRequest: fhir.MedicationRequest) {
    const hl7V3LineItem = new prescriptions.LineItem()

    const fhirMedicationCode = getCodingForSystem(fhirMedicationRequest.medicationCodeableConcept.coding, "http://snomed.info/sct")
    const hl7V3MedicationCode = new codes.SnomedCode(fhirMedicationCode.code, fhirMedicationCode.display)
    const manufacturedRequestedMaterial = new prescriptions.ManufacturedRequestedMaterial(hl7V3MedicationCode);
    const manufacturedProduct = new prescriptions.ManufacturedProduct(manufacturedRequestedMaterial);
    hl7V3LineItem.product = new prescriptions.Product(manufacturedProduct)

    const dosageInstructionsValue = fhirMedicationRequest.dosageInstruction
        .map(dosageInstruction => dosageInstruction.text)
        .reduce(onlyElement)
    const hl7V3DosageInstructions = new prescriptions.DosageInstructions(dosageInstructionsValue)
    hl7V3LineItem.pertinentInformation2 = new prescriptions.LineItemPertinentInformation2(hl7V3DosageInstructions)

    const hl7V3LineItemQuantity = new prescriptions.LineItemQuantity()
    const fhirQuantity = fhirMedicationRequest.dispenseRequest.quantity
    const hl7V3UnitCode = new codes.SnomedCode(fhirQuantity.code, fhirQuantity.unit)
    hl7V3LineItemQuantity.quantity = new core.QuantityInAlternativeUnits(fhirQuantity.value, fhirQuantity.value, hl7V3UnitCode)
    hl7V3LineItem.component = new prescriptions.LineItemComponent(hl7V3LineItemQuantity)

    return hl7V3LineItem
}

function convertPractitionerRole(fhirBundle: fhir.Bundle, fhirPractitionerRole: fhir.PractitionerRole): peoplePlaces.AgentPerson {
    const fhirPractitioner = getResourceForFullUrl(fhirBundle, fhirPractitionerRole.practitioner.reference)
    const hl7V3AgentPerson = convertPractitioner(fhirBundle, fhirPractitioner)
    const fhirOrganization = getResourceForFullUrl(fhirBundle, fhirPractitionerRole.organization.reference)
    hl7V3AgentPerson.representedOrganization = convertOrganization(fhirBundle, fhirOrganization)
    return hl7V3AgentPerson
}

function convertPractitioner(fhirBundle: fhir.Bundle, fhirPractitioner: fhir.Practitioner): peoplePlaces.AgentPerson {
    const hl7V3AgentPerson = new peoplePlaces.AgentPerson()

    const sdsRoleProfileIdentifier = getIdentifierValueForSystem(fhirPractitioner.identifier, "https://fhir.nhs.uk/Id/sds-role-profile-id")
    hl7V3AgentPerson.id = new codes.SdsRoleProfileIdentifier(sdsRoleProfileIdentifier)
    const sdsJobRoleCode = getIdentifierValueForSystem(fhirPractitioner.identifier, "https://fhir.nhs.uk/Id/sds-job-role-id")
    hl7V3AgentPerson.code = new codes.SdsJobRoleCode(sdsJobRoleCode)
    if (fhirPractitioner.telecom !== undefined) {
        hl7V3AgentPerson.telecom = fhirPractitioner.telecom
            .map(convertTelecom)
    }

    const hl7V3AgentPersonPerson = new peoplePlaces.AgentPersonPerson()
    const sdsUniqueIdentifier = getIdentifierValueForSystem(fhirPractitioner.identifier, "https://fhir.nhs.uk/Id/sds-user-id")
    hl7V3AgentPersonPerson.id = new codes.SdsUniqueIdentifier(sdsUniqueIdentifier)
    if (fhirPractitioner.name !== undefined) {
        hl7V3AgentPersonPerson.name = fhirPractitioner.name
            .map(convertName)
            .reduce(onlyElement)
    }

    hl7V3AgentPerson.agentPerson = hl7V3AgentPersonPerson

    return hl7V3AgentPerson
}

function convertOrganization(fhirBundle: fhir.Bundle, fhirOrganization: fhir.Organization) {
    const hl7V3Organization = new peoplePlaces.Organization()

    const organizationSdsId = getIdentifierValueForSystem(fhirOrganization.identifier, "https://fhir.nhs.uk/Id/ods-organization-code")
    hl7V3Organization.id = new codes.SdsOrganizationIdentifier(organizationSdsId)
    const organizationTypeCoding = getCodeableConceptCodingForSystem(fhirOrganization.type, "urn:oid:2.16.840.1.113883.2.1.3.2.4.17.94")
    hl7V3Organization.code = new codes.OrganizationTypeCode(organizationTypeCoding.code)
    hl7V3Organization.name = fhirOrganization.name
    if (fhirOrganization.telecom !== undefined) {
        hl7V3Organization.telecom = fhirOrganization.telecom
            .map(convertTelecom)
            .reduce(onlyElement)
    }
    if (fhirOrganization.address !== undefined) {
        hl7V3Organization.addr = fhirOrganization.address
            .map(convertAddress)
            .reduce(onlyElement)
    }

    if (fhirOrganization.partOf !== undefined) {
        const fhirParentOrganization = getResourceForFullUrl(fhirBundle, fhirOrganization.partOf.reference)
        const hl7V3ParentOrganization = convertOrganization(fhirBundle, fhirParentOrganization)
        hl7V3Organization.healthCareProviderLicense = new peoplePlaces.HealthCareProviderLicense(hl7V3ParentOrganization)
    }

    return hl7V3Organization
}

function convertName(fhirHumanName: fhir.HumanName) {
    const name = new core.Name()
    if (fhirHumanName.family !== undefined) {
        name.family = fhirHumanName.family
    }
    if (fhirHumanName.given !== undefined) {
        name.given = fhirHumanName.given
    }
    if (fhirHumanName.prefix !== undefined) {
        name.prefix = fhirHumanName.prefix
    }
    if (fhirHumanName.suffix !== undefined) {
        name.suffix = fhirHumanName.suffix
    }
    return name
}

function convertTelecom(fhirTelecom: fhir.ContactPoint) {
    const hl7V3TelecomUse = convertTelecomUse(fhirTelecom.use)
    //TODO - do we need to add "tel:", "mailto:" to the value?
    return new core.Telecom(hl7V3TelecomUse, fhirTelecom.value)
}

function convertTelecomUse(fhirTelecomUse: string) {
    switch (fhirTelecomUse) {
        case "home":
            return core.TelecomUse.PERMANENT_HOME
        case "work":
            return core.TelecomUse.WORKPLACE
        case "temp":
            return core.TelecomUse.TEMPORARY
        case "mobile":
            return core.TelecomUse.MOBILE
        default:
            throw TypeError("Unhandled telecom use " + fhirTelecomUse)
    }
}

function convertAddress(fhirAddress: fhir.Address) {
    const hl7V3AddressUse = convertAddressUse(fhirAddress.use, fhirAddress.type)
    const hl7V3AddressLines = [fhirAddress.line, fhirAddress.city, fhirAddress.district, fhirAddress.state]
        .filter(fhirField => fhirField !== undefined)
        .reduce((previousValue: string[], currentValue: string) => previousValue.concat(currentValue), [])
    return new core.Address(hl7V3AddressUse, hl7V3AddressLines, fhirAddress.postalCode)
}

function convertAddressUse(fhirAddressUse: string, fhirAddressType: string) {
    if (fhirAddressType === "postal") {
        return core.AddressUse.POSTAL
    }
    switch (fhirAddressUse) {
        case "home":
            return core.AddressUse.HOME
        case "work":
            return core.AddressUse.WORK
        case "temp":
            return core.AddressUse.TEMPORARY
        default:
            throw TypeError("Unhandled address use " + fhirAddressUse)
    }
}

function convertGender(fhirGender: string) {
    switch (fhirGender) {
        case "male":
            return codes.SexCode.MALE
        case "female":
            return codes.SexCode.FEMALE
        case "other":
            return codes.SexCode.INDETERMINATE
        case "unknown":
            return codes.SexCode.UNKNOWN
        default:
            throw new TypeError("Unhandled gender " + fhirGender)
    }
}

export function convertFhirMessageToHl7V3ParentPrescription(fhirMessage: fhir.Bundle): string {
    const root = {
        ParentPrescription: convertBundleToParentPrescription(fhirMessage)
    }
    const options = {compact: true, ignoreComment: true, spaces: 4}
    //TODO - canonicalize XML before returning?
    return XmlJs.js2xml(root, options)
}

export function convertFhirMessageToHl7V3SignatureFragments(fhirMessage: fhir.Bundle): string {
    const parentPrescription = convertBundleToParentPrescription(fhirMessage)
    const pertinentPrescription = parentPrescription.pertinentInformation1.pertinentPrescription
    const fragments = []

    fragments.push({
        time: namespacedCopyOf(pertinentPrescription.author.time),
        id: namespacedCopyOf(pertinentPrescription.id[0])
    })

    fragments.push({
        AgentPerson: namespacedCopyOf(pertinentPrescription.author.AgentPerson)
    })

    fragments.push({
        recordTarget: namespacedCopyOf(parentPrescription.recordTarget)
    })

    pertinentPrescription.pertinentInformation2.forEach(
        pertinentInformation2 => fragments.push({
            pertinentLineItem: namespacedCopyOf(pertinentInformation2.pertinentLineItem)
        })
    )

    const messageDigest = {
        FragmentsToBeHashed: {
            Fragment: fragments
        }
    }

    const options = {
        compact: true,
        ignoreComment: true,
        spaces: 0,
        fullTagEmptyElement: true,
        attributeValueFn: canonicaliseAttribute,
        attributesFn: sortAttributes
    }
    //TODO do we need to worry about newlines inside tags?
    return generateSignedInfo(XmlJs.js2xml(messageDigest, options).replace(/\r?\n/, ""))
}

function canonicaliseAttribute(attribute: string){
    attribute = attribute.replace(/[\t\f]+/g, " ")
    attribute = attribute.replace(/\r?\n/g, " ")
    return attribute
}

function namespacedCopyOf(tag: any) {
    const newTag = {...tag}
    newTag._attributes = {
        xmlns: "urn:hl7-org:v3",
        ...newTag._attributes
    }
    return newTag
}

function sortAttributes(attributes: any) {
    const newAttributes = {
        xmlns: attributes.xmlns
    } as any
    Object.getOwnPropertyNames(attributes)
        .sort()
        .forEach(propertyName => newAttributes[propertyName] = attributes[propertyName])
    return newAttributes
}

function onlyElement<T>(previousValue: T, currentValue: T, currentIndex: number, array: T[]): never {
    throw TypeError("Expected 1 element but got " + array.length + ": " + JSON.stringify(array))
}

function generateSignedInfo(signatureFragment: string): string{
    const digestValue = crypto.SHA1(signatureFragment)
    return "<SignedInfo>" +
            "<CanonicalizationMethod Algorithm=\"http://www.w3.org/2001/10/xml-exc-c14n#\"></CanonicalizationMethod>" +
            "<SignatureMethod Algorithm=\"http://www.w3.org/2000/09/xmldsig#rsa-sha1\"></SignatureMethod>" +
            "<Reference>" +
                "<Transforms>" +
                    "<Transform Algorithm=\"http://www.w3.org/2001/10/xml-exc-c14n#\"></Transform>" +
                "</Transforms>" +
                "<DigestMethod Algorithm=\"http://www.w3.org/2000/09/xmldsig#sha1\"></DigestMethod>" +
                `<DigestValue>${digestValue}</DigestValue>` +
            "</Reference>" +
        "</SignedInfo>"
}

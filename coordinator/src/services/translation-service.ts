import * as XmlJs from 'xml-js'
import * as codes from "./hl7-v3-datatypes-codes"
import * as core from "./hl7-v3-datatypes-core"
import * as peoplePlaces from "./hl7-v3-people-places"
import * as prescriptions from "./hl7-v3-prescriptions"
import * as fhir from "./fhir-resources"
import * as crypto from "crypto-js"
import moment from "moment"

//TODO - is there a better way than returning Array<unknown>?
export function getResourcesOfType(fhirBundle: fhir.Bundle, resourceType: string): Array<unknown> {
    return fhirBundle.entry
        .map(entry => entry.resource)
        .filter(resource => resource.resourceType === resourceType)
}

export function getResourceForFullUrl(fhirBundle: fhir.Bundle, resourceFullUrl: string): fhir.Resource {
    return fhirBundle.entry
        .filter(entry => entry.fullUrl === resourceFullUrl)
        .reduce(onlyElement)
        .resource
}

function resolveReference<T extends fhir.Resource>(bundle: fhir.Bundle, reference: fhir.Reference<T>): T {
    return getResourceForFullUrl(bundle, reference.reference) as T
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

function convertCareRecordElementCategories(lineItems: Array<prescriptions.LineItem>) {
    const careRecordElementCategory = new prescriptions.CareRecordElementCategory();
    careRecordElementCategory.component = lineItems
        .map(act => new prescriptions.ActRef(act))
        .map(actRef => new prescriptions.CareRecordElementCategoryComponent(actRef))
    return careRecordElementCategory
}

function convertDateTime(isoDateTimeStr: string) {
    const dateTime = moment.utc(isoDateTimeStr, moment.ISO_8601, true)
    const hl7V3DateTimeStr = dateTime.format("YYYYMMDDHHmmss")
    return new core.Timestamp(hl7V3DateTimeStr)
}

function convertDate(isoDateStr: string) {
    const dateTime = moment.utc(isoDateStr, moment.ISO_8601, true)
    const hl7V3DateStr = dateTime.format("YYYYMMDD")
    return new core.Timestamp(hl7V3DateStr)
}

export function convertBundleToParentPrescription(
    fhirBundle: fhir.Bundle,
    convertPatientFn = convertPatient,
    convertBundleToPrescriptionFn = convertBundleToPrescription,
    convertCareRecordElementCategoriesFn = convertCareRecordElementCategories
): prescriptions.ParentPrescription {
    const fhirMedicationRequests = getResourcesOfType(fhirBundle, "MedicationRequest") as Array<fhir.MedicationRequest>
    const fhirFirstMedicationRequest = fhirMedicationRequests[0]

    const hl7V3ParentPrescription = new prescriptions.ParentPrescription(
        new codes.GlobalIdentifier(fhirBundle.id),
        convertDateTime(fhirFirstMedicationRequest.authoredOn)
    )

    const fhirPatient = getResourcesOfType(fhirBundle, "Patient")[0] as fhir.Patient
    const hl7V3Patient = convertPatientFn(fhirBundle, fhirPatient)
    hl7V3ParentPrescription.recordTarget = new prescriptions.RecordTarget(hl7V3Patient)

    const hl7V3Prescription = convertBundleToPrescriptionFn(fhirBundle)
    hl7V3ParentPrescription.pertinentInformation1 = new prescriptions.ParentPrescriptionPertinentInformation1(hl7V3Prescription)

    const lineItems = hl7V3ParentPrescription.pertinentInformation1.pertinentPrescription.pertinentInformation2.map(info => info.pertinentLineItem)
    const careRecordElementCategory = convertCareRecordElementCategoriesFn(lineItems)
    hl7V3ParentPrescription.pertinentInformation2 = new prescriptions.ParentPrescriptionPertinentInformation2(careRecordElementCategory)

    return hl7V3ParentPrescription
}

function getGeneralPractitionerOdsOrganizationCode(
    bundle: fhir.Bundle,
    patient: fhir.Patient
) {
    const generalPractitionerReference = patient.generalPractitioner.reduce(onlyElement)
    const fhirPractitionerRole = resolveReference(bundle, generalPractitionerReference)
    const fhirOrganization = resolveReference(bundle, fhirPractitionerRole.organization)
    return getIdentifierValueForSystem(fhirOrganization.identifier, "https://fhir.nhs.uk/Id/ods-organization-code");
}

function convertPatientToProviderPatient(
    bundle: fhir.Bundle,
    patient: fhir.Patient,
    getGeneralPractitionerOrganizationCodeFn = getGeneralPractitionerOdsOrganizationCode
) {
    const gpOdsCode = getGeneralPractitionerOrganizationCodeFn(bundle, patient);
    const hl7V3HealthCareProvider = new peoplePlaces.HealthCareProvider()
    hl7V3HealthCareProvider.id = new codes.SdsOrganizationIdentifier(gpOdsCode)
    const hl7V3PatientCareProvision = new peoplePlaces.PatientCareProvision("1")
    hl7V3PatientCareProvision.responsibleParty = new peoplePlaces.ResponsibleParty(hl7V3HealthCareProvider)
    const hl7V3ProviderPatient = new peoplePlaces.ProviderPatient()
    hl7V3ProviderPatient.subjectOf = new peoplePlaces.SubjectOf(hl7V3PatientCareProvision)
    return hl7V3ProviderPatient;
}

function convertPatientToPatientPerson(
    bundle: fhir.Bundle,
    patient: fhir.Patient,
    convertNameFn = convertName,
    convertGenderFn = convertGender,
    convertPatientToProviderPatientFn = convertPatientToProviderPatient
) {
    const hl7V3PatientPerson = new peoplePlaces.PatientPerson()
    hl7V3PatientPerson.name = patient.name.map(convertNameFn)
    hl7V3PatientPerson.administrativeGenderCode = convertGenderFn(patient.gender)
    hl7V3PatientPerson.birthTime = convertDate(patient.birthDate)
    hl7V3PatientPerson.playedProviderPatient = convertPatientToProviderPatientFn(bundle, patient)
    return hl7V3PatientPerson;
}

export function convertPatient(
    fhirBundle: fhir.Bundle,
    fhirPatient: fhir.Patient,
    getIdentifierValueForSystemFn = getIdentifierValueForSystem,
    convertAddressFn = convertAddress,
    convertPatientToPatientPersonFn = convertPatientToPatientPerson
): peoplePlaces.Patient {
    const hl7V3Patient = new peoplePlaces.Patient()
    const nhsNumber = getIdentifierValueForSystemFn(fhirPatient.identifier, "https://fhir.nhs.uk/Id/nhs-number")
    hl7V3Patient.id = new codes.NhsNumber(nhsNumber)
    hl7V3Patient.addr = fhirPatient.address.map(convertAddressFn)
    hl7V3Patient.patientPerson = convertPatientToPatientPersonFn(fhirBundle, fhirPatient)
    return hl7V3Patient
}

function convertPrescriptionIds(
    fhirFirstMedicationRequest: fhir.MedicationRequest
): [codes.GlobalIdentifier, codes.ShortFormPrescriptionIdentifier] {
    const groupIdentifier = fhirFirstMedicationRequest.groupIdentifier;
    const prescriptionId = groupIdentifier.extension.map(extension => extension.valueIdentifier.value).reduce(onlyElement)
    const prescriptionShortFormId = groupIdentifier.value
    return [
        new codes.GlobalIdentifier(prescriptionId),
        new codes.ShortFormPrescriptionIdentifier(prescriptionShortFormId)
    ]
}

function convertAuthor(
    fhirBundle: fhir.Bundle,
    fhirFirstMedicationRequest: fhir.MedicationRequest,
    convertPractitionerRoleFn = convertPractitionerRole
) {
    const hl7V3Author = new prescriptions.Author()
    hl7V3Author.time = convertDateTime(fhirFirstMedicationRequest.authoredOn)
    // TODO implement signatureText
    hl7V3Author.signatureText = core.Null.NOT_APPLICABLE
    const fhirAuthorPractitionerRole = resolveReference(fhirBundle, fhirFirstMedicationRequest.requester)
    hl7V3Author.AgentPerson = convertPractitionerRoleFn(fhirBundle, fhirAuthorPractitionerRole)
    return hl7V3Author;
}

function convertResponsibleParty(
    fhirBundle: fhir.Bundle,
    convertPractitionerRoleFn = convertPractitionerRole
) {
    const responsibleParty = new prescriptions.ResponsibleParty()
    const fhirPatient = getResourcesOfType(fhirBundle, "Patient")[0] as fhir.Patient
    const generalPractitionerReference = fhirPatient.generalPractitioner.reduce(onlyElement)
    const fhirResponsiblePartyPractitionerRole = resolveReference(fhirBundle, generalPractitionerReference)
    responsibleParty.AgentPerson = convertPractitionerRoleFn(fhirBundle, fhirResponsiblePartyPractitionerRole)
    return responsibleParty;
}

function convertPrescriptionPertinentInformation5() {
    //TODO - implement
    const prescriptionTreatmentTypeValue = new codes.PrescriptionTreatmentTypeCode("0003");
    const prescriptionTreatmentType = new prescriptions.PrescriptionTreatmentType(prescriptionTreatmentTypeValue)
    return new prescriptions.PrescriptionPertinentInformation5(prescriptionTreatmentType);
}

function convertPrescriptionPertinentInformation1() {
    //TODO - implement
    const dispensingSitePreferenceValue = new codes.DispensingSitePreferenceCode("0004");
    const dispensingSitePreference = new prescriptions.DispensingSitePreference(dispensingSitePreferenceValue)
    return new prescriptions.PrescriptionPertinentInformation1(dispensingSitePreference);
}

function convertPrescriptionPertinentInformation2(fhirMedicationRequests: Array<fhir.MedicationRequest>) {
    return fhirMedicationRequests
        .map(convertMedicationRequestToLineItem)
        .map(hl7V3LineItem => new prescriptions.PrescriptionPertinentInformation2(hl7V3LineItem));
}

function convertPrescriptionPertinentInformation8() {
    //TODO - implement
    const tokenIssuedValue = new core.BooleanValue(false);
    const tokenIssued = new prescriptions.TokenIssued(tokenIssuedValue)
    return new prescriptions.PrescriptionPertinentInformation8(tokenIssued);
}

function convertPrescriptionPertinentInformation4(fhirFirstMedicationRequest: fhir.MedicationRequest) {
    const fhirMedicationRequestCategoryCoding = getCodeableConceptCodingForSystem(fhirFirstMedicationRequest.category, "urn:oid:2.16.840.1.113883.2.1.3.2.4.17.25")
    const prescriptionTypeValue = new codes.PrescriptionTypeCode(fhirMedicationRequestCategoryCoding.code)
    const prescriptionType = new prescriptions.PrescriptionType(prescriptionTypeValue)
    return new prescriptions.PrescriptionPertinentInformation4(prescriptionType);
}

function convertPerformer(fhirBundle: fhir.Bundle, performerReference: fhir.Reference<fhir.Organization>) {
    const fhirOrganization = resolveReference(fhirBundle, performerReference)
    const hl7V3Organization = convertOrganization(fhirBundle, fhirOrganization)
    const hl7V3AgentOrganization = new peoplePlaces.AgentOrganization(hl7V3Organization)
    return new prescriptions.Performer(hl7V3AgentOrganization)
}

function convertBundleToPrescription(fhirBundle: fhir.Bundle) {
    const fhirMedicationRequests = getResourcesOfType(fhirBundle, "MedicationRequest") as Array<fhir.MedicationRequest>
    const fhirFirstMedicationRequest = fhirMedicationRequests[0]

    const hl7V3Prescription = new prescriptions.Prescription(
        ...convertPrescriptionIds(fhirFirstMedicationRequest)
    )

    if (fhirFirstMedicationRequest.performer !== undefined) {
        hl7V3Prescription.performer = convertPerformer(fhirBundle, fhirFirstMedicationRequest.performer)
    }
    hl7V3Prescription.author = convertAuthor(fhirBundle, fhirFirstMedicationRequest)
    hl7V3Prescription.responsibleParty = convertResponsibleParty(fhirBundle)

    hl7V3Prescription.pertinentInformation5 = convertPrescriptionPertinentInformation5()
    hl7V3Prescription.pertinentInformation1 = convertPrescriptionPertinentInformation1()
    hl7V3Prescription.pertinentInformation2 = convertPrescriptionPertinentInformation2(fhirMedicationRequests)
    hl7V3Prescription.pertinentInformation8 = convertPrescriptionPertinentInformation8()
    hl7V3Prescription.pertinentInformation4 = convertPrescriptionPertinentInformation4(fhirFirstMedicationRequest)

    return hl7V3Prescription
}

function convertProduct(medicationCodeableConcept: fhir.CodeableConcept) {
    const fhirMedicationCode = getCodingForSystem(medicationCodeableConcept.coding, "http://snomed.info/sct")
    const hl7V3MedicationCode = new codes.SnomedCode(fhirMedicationCode.code, fhirMedicationCode.display)
    const manufacturedRequestedMaterial = new prescriptions.ManufacturedRequestedMaterial(hl7V3MedicationCode);
    const manufacturedProduct = new prescriptions.ManufacturedProduct(manufacturedRequestedMaterial);
    return new prescriptions.Product(manufacturedProduct);
}

function convertDosageInstructions(dosageInstruction: Array<fhir.Dosage>) {
    const dosageInstructionsValue = dosageInstruction
        .map(dosageInstruction => dosageInstruction.text)
        .reduce(onlyElement)
    const hl7V3DosageInstructions = new prescriptions.DosageInstructions(dosageInstructionsValue)
    return new prescriptions.LineItemPertinentInformation2(hl7V3DosageInstructions);
}

function convertLineItemComponent(fhirQuantity: fhir.SimpleQuantity) {
    const hl7V3LineItemQuantity = new prescriptions.LineItemQuantity()
    const hl7V3UnitCode = new codes.SnomedCode(fhirQuantity.code, fhirQuantity.unit)
    hl7V3LineItemQuantity.quantity = new core.QuantityInAlternativeUnits(fhirQuantity.value, fhirQuantity.value, hl7V3UnitCode)
    return new prescriptions.LineItemComponent(hl7V3LineItemQuantity);
}

function convertMedicationRequestToLineItem(fhirMedicationRequest: fhir.MedicationRequest) {
    const hl7V3LineItem = new prescriptions.LineItem(
        new codes.GlobalIdentifier(fhirMedicationRequest.id)
    )

    hl7V3LineItem.product = convertProduct(fhirMedicationRequest.medicationCodeableConcept)
    hl7V3LineItem.component = convertLineItemComponent(fhirMedicationRequest.dispenseRequest.quantity)
    hl7V3LineItem.pertinentInformation2 = convertDosageInstructions(fhirMedicationRequest.dosageInstruction)
    return hl7V3LineItem
}

function convertPractitionerRole(fhirBundle: fhir.Bundle, fhirPractitionerRole: fhir.PractitionerRole): peoplePlaces.AgentPerson {
    const fhirPractitioner = resolveReference(fhirBundle, fhirPractitionerRole.practitioner)
    const hl7V3AgentPerson = convertPractitioner(fhirBundle, fhirPractitioner)
    const fhirOrganization = resolveReference(fhirBundle, fhirPractitionerRole.organization)
    hl7V3AgentPerson.representedOrganization = convertOrganization(fhirBundle, fhirOrganization)
    return hl7V3AgentPerson
}

function convertAgentPersonPerson(fhirPractitioner: fhir.Practitioner) {
    const hl7V3AgentPersonPerson = new peoplePlaces.AgentPersonPerson()
    const sdsUniqueIdentifier = getIdentifierValueForSystem(fhirPractitioner.identifier, "https://fhir.nhs.uk/Id/sds-user-id")
    hl7V3AgentPersonPerson.id = new codes.SdsUniqueIdentifier(sdsUniqueIdentifier)
    if (fhirPractitioner.name !== undefined) {
        hl7V3AgentPersonPerson.name = fhirPractitioner.name.map(convertName).reduce(onlyElement)
    }
    return hl7V3AgentPersonPerson;
}

function convertPractitioner(
    fhirBundle: fhir.Bundle,
    fhirPractitioner: fhir.Practitioner,
    convertAgentPersonPersonFn = convertAgentPersonPerson
): peoplePlaces.AgentPerson {
    const hl7V3AgentPerson = new peoplePlaces.AgentPerson()

    const sdsRoleProfileIdentifier = getIdentifierValueForSystem(fhirPractitioner.identifier, "https://fhir.nhs.uk/Id/sds-role-profile-id")
    hl7V3AgentPerson.id = new codes.SdsRoleProfileIdentifier(sdsRoleProfileIdentifier)

    const sdsJobRoleCode = getIdentifierValueForSystem(fhirPractitioner.identifier, "https://fhir.nhs.uk/Id/sds-job-role-id")
    hl7V3AgentPerson.code = new codes.SdsJobRoleCode(sdsJobRoleCode)

    if (fhirPractitioner.telecom !== undefined) {
        hl7V3AgentPerson.telecom = fhirPractitioner.telecom.map(convertTelecom)
    }

    hl7V3AgentPerson.agentPerson = convertAgentPersonPersonFn(fhirPractitioner)

    return hl7V3AgentPerson
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

function convertOrganization(
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

function convertName(fhirHumanName: fhir.HumanName) {
    const nameUse = fhirHumanName.use !== undefined ? convertNameUse(fhirHumanName.use) : undefined
    const name = new core.Name(nameUse)
    if (fhirHumanName.prefix !== undefined) {
        name.prefix = fhirHumanName.prefix.map(name => new core.Text(name))
    }
    if (fhirHumanName.given !== undefined) {
        name.given = fhirHumanName.given.map(name => new core.Text(name))
    }
    if (fhirHumanName.family !== undefined) {
        name.family = new core.Text(fhirHumanName.family)
    }
    if (fhirHumanName.suffix !== undefined) {
        name.suffix = fhirHumanName.suffix.map(name => new core.Text(name))
    }
    return name
}

function convertNameUse(fhirNameUse: string) {
    switch (fhirNameUse) {
        case "usual":
            return core.NameUse.USUAL
        case "official":
            return core.NameUse.USUAL
        case "nickname":
            return core.NameUse.ALIAS
        default:
            throw TypeError("Unhandled name use " + fhirNameUse)
    }
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
    const allAddressLines = [
        ...fhirAddress.line,
        fhirAddress.city,
        fhirAddress.district,
        fhirAddress.state
    ].filter(line => line !== undefined)
    const hl7V3Address = new core.Address(hl7V3AddressUse)
    hl7V3Address.streetAddressLine = allAddressLines.map(line => new core.Text(line))
    hl7V3Address.postalCode = new core.Text(fhirAddress.postalCode)
    return hl7V3Address
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

export function convertParentPrescriptionToSignatureFragments(parentPrescription: prescriptions.ParentPrescription): XmlJs.ElementCompact {
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

    return {
        FragmentsToBeHashed: {
            Fragment: fragments
        }
    } as XmlJs.ElementCompact
}

export function writeXmlStringCanonicalized(tag: XmlJs.ElementCompact): string {
    const options = {
        compact: true,
        ignoreComment: true,
        spaces: 0,
        fullTagEmptyElement: true,
        attributeValueFn: canonicaliseAttribute,
        attributesFn: sortAttributes
    } as unknown as XmlJs.Options.JS2XML //declared type for attributesFn is wrong :(
    //TODO do we need to worry about newlines inside tags?
    return XmlJs.js2xml(tag, options).replace(/\r?\n/, "");
}

export function convertFhirMessageToHl7V3SignedInfo(fhirMessage: fhir.Bundle): string {
    const parentPrescription = convertBundleToParentPrescription(fhirMessage)
    const fragmentsToBeHashed = convertParentPrescriptionToSignatureFragments(parentPrescription);
    const fragmentsToBeHashedStr = writeXmlStringCanonicalized(fragmentsToBeHashed);
    const digestValue = crypto.SHA1(fragmentsToBeHashedStr).toString(crypto.enc.Base64)
    const signedInfo = convertSignatureFragmentsToSignedInfo(digestValue)
    return writeXmlStringCanonicalized(signedInfo)
}

function canonicaliseAttribute(attribute: string) {
    attribute = attribute.replace(/[\t\f]+/g, " ")
    attribute = attribute.replace(/\r?\n/g, " ")
    return attribute
}

function namespacedCopyOf(tag: XmlJs.ElementCompact) {
    const newTag = {...tag} as XmlJs.ElementCompact
    newTag._attributes = {
        xmlns: "urn:hl7-org:v3",
        ...newTag._attributes
    }
    return newTag
}

export function sortAttributes(attributes: XmlJs.Attributes): XmlJs.Attributes {
    const newAttributes = {
        xmlns: attributes.xmlns
    } as XmlJs.Attributes
    Object.getOwnPropertyNames(attributes)
        .sort()
        .forEach(propertyName => newAttributes[propertyName] = attributes[propertyName])
    return newAttributes
}

function onlyElement<T>(previousValue: T, currentValue: T, currentIndex: number, array: T[]): never {
    throw TypeError("Expected 1 element but got " + array.length + ": " + JSON.stringify(array))
}

function convertSignatureFragmentsToSignedInfo(digestValue: string): XmlJs.ElementCompact {
    return {
        SignedInfo: {
            CanonicalizationMethod: new AlgorithmIdentifier("http://www.w3.org/2001/10/xml-exc-c14n#"),
            SignatureMethod: new AlgorithmIdentifier("http://www.w3.org/2000/09/xmldsig#rsa-sha1"),
            Reference: {
                Transforms: {
                    Transform: new AlgorithmIdentifier("http://www.w3.org/2001/10/xml-exc-c14n#")
                },
                DigestMethod: new AlgorithmIdentifier("http://www.w3.org/2000/09/xmldsig#sha1"),
                DigestValue: digestValue
            }
        }
    } as XmlJs.ElementCompact
}

class AlgorithmIdentifier implements XmlJs.ElementCompact {
    _attributes: {
        Algorithm: string
    }

    constructor(algorithm: string) {
        this._attributes = {
            Algorithm: algorithm
        }
    }
}

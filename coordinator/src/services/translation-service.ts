const XmlJs = require("xml-js")

import * as codes from "./hl7-v3-datatypes-codes"
import * as core from "./hl7-v3-datatypes-core"
import * as peoplePlaces from "./hl7-v3-people-places"
import * as prescriptions from "./hl7-v3-prescriptions"
import * as fhir from "./fhir-resources"

function getResourcesOfType(fhirBundle: fhir.Bundle, resourceType: string) {
    return fhirBundle.entry
        .map(entry => entry.resource)
        .filter(resource => resource.resourceType === resourceType)
}

function getResourceForFullUrl(fhirBundle: fhir.Bundle, resourceFullUrl: string) {
    return fhirBundle.entry.filter(entry => entry.fullUrl === resourceFullUrl)[0].resource
}

function getIdentifierValueForSystem(identifier: Array<fhir.Identifier>, system: string) {
    return identifier.filter(identifier => identifier.system === system)[0].value
}

function convertBundleToParentPrescription(fhirBundle: fhir.Bundle) {
    const hl7V3ParentPrescription = new prescriptions.ParentPrescription()

    hl7V3ParentPrescription.id = new codes.GlobalIdentifier(fhirBundle.id)
    const fhirMedicationRequests = <Array<fhir.MedicationRequest>><unknown>getResourcesOfType(fhirBundle, "MedicationRequest")
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
    hl7V3Patient.addr = fhirPatient.address.map(convertAddress)

    const hl7V3PatientPerson = new peoplePlaces.PatientPerson()
    hl7V3PatientPerson.name = fhirPatient.name.map(convertName)
    hl7V3PatientPerson.administrativeGenderCode = convertGender(fhirPatient.gender)
    hl7V3PatientPerson.birthTime = new core.Timestamp(fhirPatient.birthDate)

    const hl7V3ProviderPatient = new peoplePlaces.ProviderPatient()
    const hl7V3HealthCareProvider = new peoplePlaces.HealthCareProvider()
    const hl7V3PatientCareProvision = new peoplePlaces.PatientCareProvision("1")
    const fhirPractitionerRole = <fhir.PractitionerRole>getResourceForFullUrl(fhirBundle, fhirPatient.generalPractitioner.reference)
    const fhirPractitioner = <fhir.Practitioner>getResourceForFullUrl(fhirBundle, fhirPractitionerRole.practitioner.reference)
    const sdsUniqueId = getIdentifierValueForSystem(fhirPractitioner.identifier, "https://fhir.nhs.uk/Id/sds-user-id")
    hl7V3HealthCareProvider.id = new codes.SdsUniqueIdentifier(sdsUniqueId)
    hl7V3PatientCareProvision.responsibleParty = new peoplePlaces.ResponsibleParty(hl7V3HealthCareProvider)
    hl7V3ProviderPatient.subjectOf = new peoplePlaces.SubjectOf(hl7V3PatientCareProvision)
    hl7V3PatientPerson.playedProviderPatient = hl7V3ProviderPatient

    hl7V3Patient.patientPerson = hl7V3PatientPerson

    return hl7V3Patient
}

function convertBundleToPrescription(fhirBundle: fhir.Bundle) {
    let hl7V3Prescription = new prescriptions.Prescription()

    const fhirMedicationRequests = <Array<fhir.MedicationRequest>><unknown>getResourcesOfType(fhirBundle, "MedicationRequest")
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
    const fhirAuthorPractitionerRole = getResourceForFullUrl(fhirBundle, fhirFirstMedicationRequest.requester.reference)
    hl7V3Author.AgentPerson = convertPractitionerRole(fhirBundle, fhirAuthorPractitionerRole)
    hl7V3Prescription.author = hl7V3Author

    const responsibleParty = new prescriptions.ResponsibleParty()
    const fhirPatient = <fhir.Patient>getResourceForFullUrl(fhirBundle, fhirFirstMedicationRequest.subject.reference)
    const fhirResponsiblePartyPractitionerRole = getResourceForFullUrl(fhirBundle, fhirPatient.generalPractitioner.reference)
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

    //TODO - implement
    const tokenIssuedValue = core.Bool.TRUE;
    const tokenIssued = new prescriptions.TokenIssued(tokenIssuedValue)
    hl7V3Prescription.pertinentInformation8 = new prescriptions.PrescriptionPertinentInformation8(tokenIssued)

    const fhirMedicationRequestCategoryCoding = fhirFirstMedicationRequest.category[0].coding[0] //TODO restrict by system
    const prescriptionTypeValue = new codes.PrescriptionTypeCode(fhirMedicationRequestCategoryCoding.code)
    const prescriptionType = new prescriptions.PrescriptionType(prescriptionTypeValue)
    hl7V3Prescription.pertinentInformation4 = new prescriptions.PrescriptionPertinentInformation4(prescriptionType)

    hl7V3Prescription.pertinentInformation2 = fhirMedicationRequests.map(convertMedicationRequestToLineItem)
        .map(hl7V3LineItem => new prescriptions.PrescriptionPertinentInformation2(hl7V3LineItem))

    return hl7V3Prescription
}

function convertMedicationRequestToLineItem(fhirMedicationRequest: fhir.MedicationRequest) {
    let hl7V3LineItem = new prescriptions.LineItem()

    const fhirMedicationCode = fhirMedicationRequest.medicationCodeableConcept.coding[0] //TODO - restrict by system
    const hl7V3MedicationCode = new codes.SnomedCode(fhirMedicationCode.code, fhirMedicationCode.display)
    let manufacturedRequestedMaterial = new prescriptions.ManufacturedRequestedMaterial(hl7V3MedicationCode);
    let manufacturedProduct = new prescriptions.ManufacturedProduct(manufacturedRequestedMaterial);
    hl7V3LineItem.product = new prescriptions.Product(manufacturedProduct)

    //TODO - don't just join with newlines, fail if more than one?
    const dosageInstructionsValue = fhirMedicationRequest.dosageInstruction.map(x => x.text).join("\n")
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
    let hl7V3AgentPerson = new peoplePlaces.AgentPerson()

    const sdsRoleProfileIdentifier = getIdentifierValueForSystem(fhirPractitioner.identifier, "https://fhir.nhs.uk/Id/sds-role-profile-id")
    hl7V3AgentPerson.id = new codes.SdsRoleProfileIdentifier(sdsRoleProfileIdentifier)
    const sdsJobRoleCode = getIdentifierValueForSystem(fhirPractitioner.identifier, "https://fhir.nhs.uk/Id/sds-job-role-id")
    hl7V3AgentPerson.code = new codes.SdsJobRoleCode(sdsJobRoleCode)
    if (fhirPractitioner.telecom) {
        hl7V3AgentPerson.telecom = fhirPractitioner.telecom.map(convertTelecom)
    }

    const hl7V3AgentPersonPerson = new peoplePlaces.AgentPersonPerson()
    const sdsUniqueIdentifier = getIdentifierValueForSystem(fhirPractitioner.identifier, "https://fhir.nhs.uk/Id/sds-user-id")
    hl7V3AgentPersonPerson.id = new codes.SdsUniqueIdentifier(sdsUniqueIdentifier)
    if (fhirPractitioner.name) {
        hl7V3AgentPersonPerson.name = fhirPractitioner.name.map(convertName)
    }

    hl7V3AgentPerson.agentPerson = hl7V3AgentPersonPerson

    return hl7V3AgentPerson
}

function convertOrganization(fhirBundle: fhir.Bundle, fhirOrganization: fhir.Organization) {
    const hl7V3Organization = new peoplePlaces.Organization()

    const organizationSdsId = getIdentifierValueForSystem(fhirOrganization.identifier, "https://fhir.nhs.uk/Id/ods-organization-code")
    hl7V3Organization.id = new codes.SdsOrganizationIdentifier(organizationSdsId)
    const organizationTypeCode = fhirOrganization.type
        .flatMap(type => type.coding)
        .filter(coding => coding.system === "urn:oid:2.16.840.1.113883.2.1.3.2.4.17.94")[0].code
    hl7V3Organization.code = new codes.OrganizationTypeCode(organizationTypeCode)
    hl7V3Organization.name = fhirOrganization.name
    if (fhirOrganization.telecom) {
        hl7V3Organization.telecom = fhirOrganization.telecom.map(convertTelecom)
    }
    if (fhirOrganization.address) {
        hl7V3Organization.addr = fhirOrganization.address.map(convertAddress)
    }

    if (fhirOrganization.partOf) {
        const fhirParentOrganization = getResourceForFullUrl(fhirBundle, fhirOrganization.partOf.reference)
        const hl7V3ParentOrganization = convertOrganization(fhirBundle, fhirParentOrganization)
        hl7V3Organization.healthCareProviderLicense = new peoplePlaces.HealthCareProviderLicense(hl7V3ParentOrganization)
    }

    return hl7V3Organization
}

function convertName(fhirHumanName: fhir.HumanName) {
    return new core.Name(fhirHumanName.family, fhirHumanName.given, fhirHumanName.prefix, fhirHumanName.suffix)
}

function convertTelecom(fhirTelecom: fhir.ContactPoint) {
    const hl7V3TelecomUse = convertTelecomUse(fhirTelecom.use)
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
            //TODO use more specific error class
            throw Error("Unhandled telecom use " + fhirTelecomUse)
    }
}

function convertAddress(fhirAddress: fhir.Address) {
    const hl7V3AddressUse = convertAddressUse(fhirAddress.use, fhirAddress.type)
    let hl7V3AddressLines: Array<string> = []
    if (fhirAddress.line) {
        hl7V3AddressLines = hl7V3AddressLines.concat(fhirAddress.line)
    }
    if (fhirAddress.city) {
        hl7V3AddressLines = hl7V3AddressLines.concat(fhirAddress.city)
    }
    if (fhirAddress.district) {
        hl7V3AddressLines = hl7V3AddressLines.concat(fhirAddress.district)
    }
    if (fhirAddress.state) {
        hl7V3AddressLines = hl7V3AddressLines.concat(fhirAddress.state)
    }
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
            //TODO use more specific error class
            throw Error("Unhandled address use " + fhirAddressUse)
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
            //TODO use more specific error class
            throw new Error("Unhandled gender " + fhirGender)
    }
}

export function convertFhirMessageToHl7V3ParentPrescription(fhirMessage: fhir.Bundle) {
    const root = {
        ParentPrescription: convertBundleToParentPrescription(fhirMessage)
    }
    const options = {compact: true, ignoreComment: true, spaces: 4}
    //TODO - canonicalize XML before returning
    return XmlJs.js2xml(root, options)
}

export function convertFhirMessageToHl7V3SignatureFragments(fhirMessage: fhir.Bundle) {
    const parentPrescription = convertBundleToParentPrescription(fhirMessage)
    const pertinentPrescription = parentPrescription.pertinentInformation1.pertinentPrescription
    const fragments = []

    fragments.push({
        time: namespacedCopyOf(pertinentPrescription.author.time),
        id: namespacedCopyOf(
            pertinentPrescription.id
                .filter(id => id._attributes.extension === undefined)
                .reduce(onlyElement)
        )
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

    const options = {compact: true, ignoreComment: true, spaces: 0, fullTagEmptyElement: true}
    return XmlJs.js2xml(messageDigest, options).replace(/\n/, "")
}

function namespacedCopyOf(tag: any) {
    const newTag = {...tag}
    newTag._attributes = {
        xmlns: "urn:hl7-org:v3",
        ...newTag._attributes
    }
    return newTag
}

function onlyElement(previousValues: any, currentValue: any) {
    if (previousValues.length !== 0) {
        throw TypeError("Expected array to have single element")
    }
    return currentValue
}

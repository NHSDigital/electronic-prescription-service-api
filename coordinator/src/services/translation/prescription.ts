import * as core from "../../model/hl7-v3-datatypes-core";
import * as prescriptions from "../../model/hl7-v3-prescriptions";
import * as fhir from "../../model/fhir-resources";
import {IdentifierExtension, MedicationRequest} from "../../model/fhir-resources";
import {getExtensionForUrl, getResourcesOfType, onlyElement, resolveReference} from "./common";
import {convertAuthor, convertResponsibleParty} from "./practitioner";
import * as codes from "../../model/hl7-v3-datatypes-codes";
import {convertOrganization} from "./organization";
import * as peoplePlaces from "../../model/hl7-v3-people-places";
import {convertMedicationRequestToLineItem} from "./line-item";

export function convertBundleToPrescription(fhirBundle: fhir.Bundle): prescriptions.Prescription {
    const fhirMedicationRequests = getResourcesOfType(fhirBundle, new MedicationRequest())
    const fhirFirstMedicationRequest = fhirMedicationRequests[0]

    const hl7V3Prescription = new prescriptions.Prescription(
        ...convertPrescriptionIds(fhirFirstMedicationRequest)
    )

    if (fhirFirstMedicationRequest.dispenseRequest.performer !== undefined) {
        hl7V3Prescription.performer = convertPerformer(fhirBundle, fhirFirstMedicationRequest.dispenseRequest.performer)
    }
    hl7V3Prescription.author = convertAuthor(fhirBundle, fhirFirstMedicationRequest)
    hl7V3Prescription.responsibleParty = convertResponsibleParty(fhirBundle, fhirFirstMedicationRequest)

    hl7V3Prescription.pertinentInformation5 = convertPrescriptionPertinentInformation5(fhirFirstMedicationRequest)
    hl7V3Prescription.pertinentInformation1 = convertPrescriptionPertinentInformation1()
    hl7V3Prescription.pertinentInformation2 = convertPrescriptionPertinentInformation2(fhirMedicationRequests)
    hl7V3Prescription.pertinentInformation8 = convertPrescriptionPertinentInformation8()
    hl7V3Prescription.pertinentInformation4 = convertPrescriptionPertinentInformation4(fhirFirstMedicationRequest)

    return hl7V3Prescription
}

function convertPrescriptionIds(
    fhirFirstMedicationRequest: fhir.MedicationRequest
): [codes.GlobalIdentifier, codes.ShortFormPrescriptionIdentifier] {
    const groupIdentifier = fhirFirstMedicationRequest.groupIdentifier;
    const prescriptionIdExtension = getExtensionForUrl(groupIdentifier.extension, "https://fhir.nhs.uk/R4/StructureDefinition/Extension-PrescriptionId") as IdentifierExtension
    const prescriptionId = prescriptionIdExtension.valueIdentifier.value
    const prescriptionShortFormId = groupIdentifier.value
    return [
        new codes.GlobalIdentifier(prescriptionId),
        new codes.ShortFormPrescriptionIdentifier(prescriptionShortFormId)
    ]
}

function convertPrescriptionPertinentInformation5(fhirFirstMedicationRequest: fhir.MedicationRequest) {
    const prescriptionTreatmentType = convertCourseOfTherapyType(fhirFirstMedicationRequest)
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
    const fhirMedicationPrescriptionTypeExtension = getExtensionForUrl(fhirFirstMedicationRequest.extension, "https://fhir.nhs.uk/R4/StructureDefinition/Extension-prescriptionType") as fhir.CodingExtension
    const prescriptionTypeValue = new codes.PrescriptionTypeCode(fhirMedicationPrescriptionTypeExtension.valueCoding.code)
    const prescriptionType = new prescriptions.PrescriptionType(prescriptionTypeValue)
    return new prescriptions.PrescriptionPertinentInformation4(prescriptionType);
}

function convertPerformer(fhirBundle: fhir.Bundle, performerReference: fhir.Reference<fhir.Organization>) {
    const fhirOrganization = resolveReference(fhirBundle, performerReference)
    const hl7V3Organization = convertOrganization(fhirBundle, fhirOrganization)
    const hl7V3AgentOrganization = new peoplePlaces.AgentOrganization(hl7V3Organization)
    return new prescriptions.Performer(hl7V3AgentOrganization)
}

export function convertCourseOfTherapyType(fhirFirstMedicationRequest: fhir.MedicationRequest): prescriptions.PrescriptionTreatmentType {
    const courseOfTherapyTypeCode = fhirFirstMedicationRequest
        .courseOfTherapyType.coding.map(coding => coding.code)
        .reduce(onlyElement)

    const prescriptionTreatmentTypeCode = convertCourseOfTherapyTypeCode(courseOfTherapyTypeCode)
    return new prescriptions.PrescriptionTreatmentType(prescriptionTreatmentTypeCode)
}

function convertCourseOfTherapyTypeCode(courseOfTherapyTypeValue: string) {
    switch (courseOfTherapyTypeValue) {
        case "acute":
            return codes.PrescriptionTreatmentTypeCode.ACUTE
        case "repeat":
            return codes.PrescriptionTreatmentTypeCode.REPEAT_PRESCRIBING
        case "repeat-dispensing":
            return codes.PrescriptionTreatmentTypeCode.REPEAT_DISPENSING
        default:
            throw TypeError("Unhandled courseOfTherapyType " + courseOfTherapyTypeValue)
    }
}

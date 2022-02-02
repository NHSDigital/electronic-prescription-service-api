import { fhir, hl7V3 } from "@models"
import { LosslessNumber } from "lossless-json"

interface GetExpectedMedicationRequestProps {
	courseOfTherapyType: "acute" | "continuous" | "continuous-repeat-dispensing"
	repeats?: {
		high: number,
		low: number
	}
}

export const getExpectedMedicationRequest = (props: GetExpectedMedicationRequestProps): fhir.MedicationRequest => {
	const { courseOfTherapyType, repeats } = props

	const medicationRequest: fhir.MedicationRequest = {
		resourceType: "MedicationRequest",
		id: "test-uuid",
		extension: [
			{
				url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner",
				valueReference: {
					reference: "urn:uuid:responsible-party-id"
				}
			},
			{
				url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
				valueCoding: {
					code: "0001",
					display: undefined,
					system: "https://fhir.nhs.uk/CodeSystem/prescription-type",
				},
			},
		],
		identifier: [
			{
				system: "https://fhir.nhs.uk/Id/prescription-order-item-number",
				value: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
			}
		],
		status: fhir.MedicationRequestStatus.ACTIVE,
		intent: fhir.MedicationRequestIntent.ORDER,
		medicationCodeableConcept: {
			coding: [{
				code: "product-sno-med-code",
				display: undefined,
				system: "http://snomed.info/sct",
			}]
		},
		note: undefined,
		subject: { reference: "urn:uuid:patient-id" },
		authoredOn: "2000-01-01T12:30:30+00:00",
		category: [{
			coding: [{
				code: "outpatient",
				display: "Outpatient",
				system: "http://terminology.hl7.org/CodeSystem/medicationrequest-category",
			}]
		}],
		requester: { reference: "urn:uuid:requester-id" },
		groupIdentifier: {
			system: "https://fhir.nhs.uk/Id/prescription-order-number",
			value: "short-form-identifier",
			extension: [{
				url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
				valueIdentifier: {
					system: "https://fhir.nhs.uk/Id/prescription",
					value: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				},
			}]
		},
		courseOfTherapyType: {
			coding: [{
				code: "acute",
				display: "Short course (acute) therapy",
				system: "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
			}]
		},
		dosageInstruction: [{ text: "test-dosage-instructon" }],
		dispenseRequest: {
			extension: [{
				url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PerformerSiteType",
				valueCoding: {
					code: "dispensing-site-preference-code",
					system: "https://fhir.nhs.uk/CodeSystem/dispensing-site-preference",
				},
			}],
			numberOfRepeatsAllowed: new LosslessNumber("0"),
			quantity: {
				value: new LosslessNumber("20"),
				system: "http://snomed.info/sct",
				code: "alternative-sno-med-code",
				unit: undefined
			}
		},
		substitution: { allowedBoolean: false }
	}

	switch (courseOfTherapyType) {
		case "acute":
			medicationRequest.extension.push({
				url: "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
				extension: [{
					url: "authorisationExpiryDate",
					valueDateTime: "2000-01-01",
				}]
			})
			break;

		case "continuous":
			medicationRequest.courseOfTherapyType.coding[0] = {
				code: "continuous",
				display: "Continuous long term therapy",
				system: "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
			}

			medicationRequest.extension.push({
				url: "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
				extension: [{
					url: "authorisationExpiryDate",
					valueDateTime: "2000-01-01",
				}, {
					url: "numberOfRepeatPrescriptionsIssued",
					valueUnsignedInt: new LosslessNumber(repeats.low.toString())
				}]
			})
			break;

		case "continuous-repeat-dispensing":
			medicationRequest.courseOfTherapyType.coding[0] = {
				code: "continuous-repeat-dispensing",
				display: "Continuous long term (repeat dispensing)",
				system: "https://fhir.nhs.uk/CodeSystem/medicationrequest-course-of-therapy",
			}

			medicationRequest.extension.push({
				url: "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
				extension: [{
					url: "authorisationExpiryDate",
					valueDateTime: "2000-01-01",
				}, {
					url: "numberOfRepeatPrescriptionsIssued",
					valueUnsignedInt: new LosslessNumber(repeats.low.toString())
				}]
			})

			medicationRequest.intent = fhir.MedicationRequestIntent.REFLEX_ORDER

			medicationRequest.basedOn = [{
				extension: [{
					extension: [{
						url: "numberOfRepeatsAllowed",
						valueInteger: new LosslessNumber(repeats.high.toString()),
					}],
					url: "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation",
				}],
				identifier: {
					reference: "urn:uuid:bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
				},
			}]
			break;
	}

	return medicationRequest
}

interface GetTestLineItemProps {
	repeats?: {
		high: number,
		low: number
	}
}

export const getTestLineItem = (props: GetTestLineItemProps): hl7V3.LineItem => {
	const { repeats } = props

	const globalId = new hl7V3.GlobalIdentifier("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
	const lineItem = new hl7V3.LineItem(globalId)

	const pertinentDosageInstructions = new hl7V3.DosageInstructions("test-dosage-instructon")
	const pertinentInformation2 = new hl7V3.LineItemPertinentInformation2(pertinentDosageInstructions)
	lineItem.pertinentInformation2 = pertinentInformation2

	const itemStatusCode = new hl7V3.ItemStatusCode("0007")
	const itemStatus = new hl7V3.ItemStatus(itemStatusCode)
	const pertinentInformation4 = new hl7V3.LineItemPertinentInformation4(itemStatus)
	lineItem.pertinentInformation4 = pertinentInformation4

	const snoMedCode = new hl7V3.SnomedCode("product-sno-med-code")
	const manufacturedRequestedMaterial = new hl7V3.ManufacturedRequestedMaterial(snoMedCode)
	const manufacturedProduct = new hl7V3.ManufacturedProduct(manufacturedRequestedMaterial)
	const product = new hl7V3.Product(manufacturedProduct)
	lineItem.product = product

	const lineItemQuantity = new hl7V3.LineItemQuantity()
	const alternativeUnitCode = new hl7V3.SnomedCode("alternative-sno-med-code")
	lineItemQuantity.quantity = new hl7V3.QuantityInAlternativeUnits(
		"10",
		"20",
		alternativeUnitCode,
	)
	const component = new hl7V3.LineItemComponent(lineItemQuantity)
	lineItem.component = component

	if (repeats) {
		const { high, low } = repeats
		lineItem.repeatNumber = {
			high: new hl7V3.NumericValue(high.toString()),
			low: new hl7V3.NumericValue(low.toString())
		}
	}

	return lineItem
}

interface GetTestPrescriptionProps {
	prescriptionTreatmentTypeCode: "0001" | "0002" | "0003"
}

export const getTestPrescription = (props: GetTestPrescriptionProps): hl7V3.Prescription => {
	const { prescriptionTreatmentTypeCode } = props

	const globalId = new hl7V3.GlobalIdentifier("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
	const shortFormId = new hl7V3.ShortFormPrescriptionIdentifier("short-form-identifier")
	const prescription = new hl7V3.Prescription(globalId, shortFormId)

	const dispensingSitePreferenceCode = new hl7V3.DispensingSitePreferenceCode("dispensing-site-preference-code")
	const dispensingSitePreference = new hl7V3.DispensingSitePreference(dispensingSitePreferenceCode)
	const pertinentInformation1 = new hl7V3.PrescriptionPertinentInformation1(dispensingSitePreference)
	prescription.pertinentInformation1 = pertinentInformation1

	const prescriptionTypeCode = new hl7V3.PrescriptionTypeCode("0001")
	const prescriptionType = new hl7V3.PrescriptionType(prescriptionTypeCode)
	const pertinentInformation4 = new hl7V3.PrescriptionPertinentInformation4(prescriptionType)
	prescription.pertinentInformation4 = pertinentInformation4

	const treatmentTypeCode = new hl7V3.PrescriptionTreatmentTypeCode(prescriptionTreatmentTypeCode)
	const treatmentType = new hl7V3.PrescriptionTreatmentType(treatmentTypeCode)
	const pertinentInformation5 = new hl7V3.PrescriptionPertinentInformation5(treatmentType)
	prescription.pertinentInformation5 = pertinentInformation5

	const reviewDate = new hl7V3.Timestamp("20000101")
	const pertinentReviewDate = new hl7V3.ReviewDate(reviewDate)
	const pertinentInformation7 = new hl7V3.PrescriptionPertinentInformation7(pertinentReviewDate)
	prescription.pertinentInformation7 = pertinentInformation7

	const author = new hl7V3.PrescriptionAuthor()
	const authoredTime = new hl7V3.Timestamp("20000101123030")
	author.time = authoredTime
	prescription.author = author

	return prescription
}

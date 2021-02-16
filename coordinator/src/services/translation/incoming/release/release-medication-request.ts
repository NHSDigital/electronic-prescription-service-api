import * as fhir from "../../../../models/fhir/fhir-resources"
import {
  DaysSupply,
  DispensingSitePreference,
  DosageInstructions,
  LineItem,
  LineItemQuantity,
  Performer,
  Prescription,
  PrescriptionEndorsement,
  PrescriptionTreatmentType,
  PrescriptionType,
  ReviewDate
} from "../../../../models/hl7-v3/hl7-v3-prescriptions"
import * as uuid from "uuid"
import {
  createGroupIdentifier,
  createItemNumberIdentifier,
  createResponsiblePractitionerExtension
} from "../medication-request"
import {createCodeableConcept, createReference} from "../fhir-base-types"
import * as codes from "../../../../models/hl7-v3/hl7-v3-datatypes-codes"
import {PrescriptionTreatmentTypeCode, SnomedCode} from "../../../../models/hl7-v3/hl7-v3-datatypes-codes"
import {CourseOfTherapyTypeCode} from "../../prescription/course-of-therapy-type"
import {Interval, IntervalUnanchored, NumericValue, Timestamp} from "../../../../models/hl7-v3/hl7-v3-datatypes-core"
import {convertHL7V3DateToIsoDateString, toArray} from "../../common"
import {Organization} from "../../../../models/hl7-v3/hl7-v3-people-places"
import {ElementCompact, xml2js} from "xml-js"

export function createMedicationRequest(
  prescription: Prescription,
  lineItem: LineItem,
  patientId: string,
  requesterId: string,
  responsiblePartyId: string
): fhir.MedicationRequest {
  return {
    resourceType: "MedicationRequest",
    id: uuid.v4(),
    extension: createMedicationRequestExtensions(prescription, lineItem, responsiblePartyId),
    identifier: [
      createItemNumberIdentifier(lineItem.id._attributes.root)
    ],
    status: "active", //TODO - check this
    intent: "order",
    medicationCodeableConcept: createSnomedCodeableConcept(
      lineItem.product.manufacturedProduct.manufacturedRequestedMaterial.code
    ),
    subject: createReference(patientId),
    authoredOn: undefined, //TODO - how do we populate this?
    requester: createReference(requesterId),
    groupIdentifier: createGroupIdentifierFromPrescriptionIds(prescription.id),
    courseOfTherapyType: createCourseOfTherapyType(
      prescription.pertinentInformation5.pertinentPrescriptionTreatmentType,
      lineItem.repeatNumber
    ),
    dosageInstruction: [
      createDosage(lineItem.pertinentInformation2.pertinentDosageInstructions)
    ],
    dispenseRequest: createDispenseRequest(
      prescription.pertinentInformation1.pertinentDispensingSitePreference,
      lineItem.component.lineItemQuantity,
      prescription.component1.daysSupply,
      prescription.performer
    ),
    substitution: createSubstitution()
  }
}

function createMedicationRequestExtensions(prescription: Prescription, lineItem: LineItem, responsiblePartyId: string) {
  const extensions: Array<fhir.MedicationRequestExtension> = [
    createResponsiblePractitionerExtension(responsiblePartyId),
    createPrescriptionTypeExtension(prescription.pertinentInformation4.pertinentPrescriptionType)
  ]
  if (lineItem.repeatNumber) {
    const repeatInformationExtension = createRepeatInformationExtension(
      prescription.pertinentInformation7.pertinentReviewDate,
      lineItem.repeatNumber
    )
    extensions.push(repeatInformationExtension)
  }
  if (lineItem.pertinentInformation3) {
    const endorsementExtensions = lineItem.pertinentInformation3.map(pi3 =>
      createEndorsementExtension(pi3.pertinentPrescriberEndorsement)
    )
    extensions.push(...endorsementExtensions)
  }
  if (lineItem.pertinentInformation1) {
    const additionalInstructionsParts = parseAdditionalInstructionsText(
      lineItem.pertinentInformation1.pertinentAdditionalInstructions.value._text
    )
    if (additionalInstructionsParts.controlledDrugWords) {
      const controlledDrugExtension = createControlledDrugExtension(additionalInstructionsParts.controlledDrugWords)
      extensions.push(controlledDrugExtension)
    }
  }
  return extensions
}

function createRepeatInformationExtension(
  reviewDate: ReviewDate,
  lineItemRepeatNumber: Interval<NumericValue>
): fhir.RepeatInformationExtension {
  return {
    url: "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
    extension: [
      {
        url: "authorisationExpiryDate",
        valueDateTime: convertHL7V3DateToIsoDateString(reviewDate.value)
      },
      {
        url: "numberOfRepeatPrescriptionsIssued",
        valueUnsignedInt: lineItemRepeatNumber.low._attributes.value
      },
      {
        url: "numberOfRepeatPrescriptionsAllowed",
        valueUnsignedInt: lineItemRepeatNumber.high._attributes.value
      }
    ]
  }
}

function createEndorsementExtension(prescriptionEndorsement: PrescriptionEndorsement): fhir.CodeableConceptExtension {
  return {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-PrescriptionEndorsement",
    valueCodeableConcept: {
      coding: [{
        code: prescriptionEndorsement.value._attributes.code,
        system: "https://fhir.nhs.uk/CodeSystem/medicationrequest-endorsement",
        display: prescriptionEndorsement.value._attributes.displayName
      }]
    }
  }
}

function createPrescriptionTypeExtension(pertinentPrescriptionType: PrescriptionType): fhir.CodingExtension {
  return {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
    valueCoding: {
      system: "https://fhir.nhs.uk/CodeSystem/prescription-type",
      code: pertinentPrescriptionType.value._attributes.code,
      display: pertinentPrescriptionType.value._attributes.displayName
    }
  }
}

interface AdditionalInstructionsParseResult {
  parts: AdditionalInstructionsParts
}

interface AdditionalInstructionsParts extends ElementCompact {
  medication: Array<ElementCompact> | ElementCompact,
  patientInfo: Array<ElementCompact> | ElementCompact
}

const controlledDrugMatcher = /^CD: (.*)\n?/

export function parseAdditionalInstructionsText(additionalInstructionsText: string): {
  medication: Array<string>,
  patientInfo: Array<string>,
  controlledDrugWords: string,
  additionalInstructions: string
} {
  const parseResult = xml2js(
    `<parts>${additionalInstructionsText}</parts>`,
    {compact: true}
  ) as AdditionalInstructionsParseResult

  const textStringOrNumber = parseResult.parts._text || ""

  let text = textStringOrNumber.toString()
  let controlledDrugWords = ""
  const controlledDrugMatch = controlledDrugMatcher.exec(text)
  if (controlledDrugMatch) {
    controlledDrugWords = controlledDrugMatch[1]
    text = text.substring(controlledDrugMatch[0].length)
  }

  // TODO - Is this easier or harder to follow than using regex?
  // if (text.startsWith("CD: ")) {
  //   const textParts = text.split("\n")
  //   controlledDrugWords = textParts[0].substring(4)
  //   text = textParts[1]
  // }

  const medication = parseResult.parts.medication || []
  const patientInfo = parseResult.parts.patientInfo || []

  return {
    medication: toArray(medication).map(m => m._text.toString()),
    patientInfo: toArray(patientInfo).map(p => p._text.toString()),
    controlledDrugWords: controlledDrugWords,
    additionalInstructions: text
  }
}

function createControlledDrugExtension(controlledDrugWords: string): fhir.ControlledDrugExtension {
  return {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ControlledDrug",
    extension: [{
      url: "quantityWords",
      valueString: controlledDrugWords
    }]
  }
}

function createCourseOfTherapyType(
  prescriptionTreatmentType: PrescriptionTreatmentType,
  lineItemRepeatNumber: Interval<NumericValue>
) {
  const isRepeatDispensing = prescriptionTreatmentType.value._attributes.code
    === PrescriptionTreatmentTypeCode.CONTINUOUS_REPEAT_DISPENSING._attributes.code
  if (isRepeatDispensing) {
    return createCodeableConcept(
      "https://fhir.nhs.uk/CodeSystem/medicationrequest-course-of-therapy",
      CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING,
      "Continuous long term (repeat dispensing)"
    )
  } else if (lineItemRepeatNumber) {
    return createCodeableConcept(
      "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
      CourseOfTherapyTypeCode.CONTINUOUS,
      "Continuous long term therapy"
    )
  } else {
    return createCodeableConcept(
      "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
      CourseOfTherapyTypeCode.ACUTE,
      "Short course (acute) therapy"
    )
  }
}

function createSnomedCodeableConcept(code: SnomedCode) {
  return createCodeableConcept("http://snomed.info/sct", code._attributes.code, code._attributes.displayName)
}

function createDosage(dosageInstructions: DosageInstructions): fhir.Dosage {
  //TODO - additional instructions
  return {
    text: dosageInstructions.value._text
  }
}

function createDispenseRequestQuantity(lineItemQuantity: LineItemQuantity): fhir.SimpleQuantity {
  const lineItemQuantityTranslation = lineItemQuantity.quantity.translation
  return {
    value: lineItemQuantityTranslation._attributes.value,
    unit: lineItemQuantityTranslation._attributes.displayName,
    system: "http://snomed.info/sct",
    code: lineItemQuantityTranslation._attributes.code
  }
}

function createValidityPeriod(effectiveTime: Interval<Timestamp>): fhir.Period {
  return {
    start: convertHL7V3DateToIsoDateString(effectiveTime.low),
    end: convertHL7V3DateToIsoDateString(effectiveTime.high)
  }
}

function createExpectedSupplyDuration(expectedUseTime: IntervalUnanchored): fhir.SimpleQuantity {
  return {
    unit: "day",
    value: expectedUseTime.width._attributes.value,
    system: "http://unitsofmeasure.org",
    code: "d"
  }
}

function createDispenseRequest(
  dispensingSitePreference: DispensingSitePreference,
  lineItemQuantity: LineItemQuantity,
  daysSupply: DaysSupply,
  performer: Performer
): fhir.MedicationRequestDispenseRequest {
  const dispenseRequest: fhir.MedicationRequestDispenseRequest = {
    extension: [
      createPerformerSiteTypeExtension(dispensingSitePreference)
    ],
    quantity: createDispenseRequestQuantity(lineItemQuantity)
  }
  if (daysSupply) {
    dispenseRequest.validityPeriod = createValidityPeriod(daysSupply.effectiveTime)
    dispenseRequest.expectedSupplyDuration = createExpectedSupplyDuration(daysSupply.expectedUseTime)
  }
  if (performer) {
    dispenseRequest.performer = createPerformer(performer.AgentOrgSDS.agentOrganizationSDS)
  }
  return dispenseRequest
}

function createPerformerSiteTypeExtension(dispensingSitePreference: DispensingSitePreference): fhir.CodingExtension {
  return {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-performerSiteType",
    valueCoding: {
      code: "https://fhir.nhs.uk/CodeSystem/dispensing-site-preference",
      display: dispensingSitePreference.value._attributes.code
    }
  }
}

function createPerformer(performerOrganization: Organization): fhir.Performer {
  return {
    identifier: {
      system: "https://fhir.nhs.uk/Id/ods-organization-code",
      value: performerOrganization.id._attributes.extension
    }
  }
}

function createGroupIdentifierFromPrescriptionIds(
  prescriptionIds: [codes.GlobalIdentifier, codes.ShortFormPrescriptionIdentifier]
) {
  const shortFormId = prescriptionIds[1]._attributes.extension
  const longFormId = prescriptionIds[0]._attributes.root //TODO - lower case?
  return createGroupIdentifier(shortFormId, longFormId)
}

function createSubstitution() {
  return {
    allowedBoolean: false as const
  }
}

import {hl7V3, fhir, processingErrors} from "@models"
import * as uuid from "uuid"
import {
  getIdentifierParameterOrNullByName,
  getOrganizationResourceFromParameters,
  getResourceParameterByName
} from "../../common"
import {convertMomentToHl7V3DateTime} from "../../common/dateTime"
import moment from "moment"
import {createAuthor} from "../agent-unattended"
import {isReference} from "../../../../utils/type-guards"

export function translateReleaseRequest(
  fhirReleaseRequest: fhir.Parameters
): hl7V3.NominatedPrescriptionReleaseRequestWrapper | hl7V3.PatientPrescriptionReleaseRequestWrapper {
  const practitionerRole = getResourceParameterByName<fhir.PractitionerRole>(
    fhirReleaseRequest.parameter,
    "agent"
  ).resource

  if (!isReference(practitionerRole.organization)) {
    throw new processingErrors.InvalidValueError('Parameters.parameter("agent").resource.organization')
  }
  const organization = getOrganizationResourceFromParameters(fhirReleaseRequest, practitionerRole.organization)

  const prescriptionIdParameter = getIdentifierParameterOrNullByName(fhirReleaseRequest.parameter, "group-identifier")
  if (prescriptionIdParameter) {
    const prescriptionId = prescriptionIdParameter.valueIdentifier.value
    return createPatientReleaseRequest(practitionerRole, organization, prescriptionId)
  } else {
    return createNominatedReleaseRequest(practitionerRole, organization)
  }
}

export function createPatientReleaseRequest(
  practitionerRole: fhir.PractitionerRole,
  organization: fhir.Organization,
  prescriptionIdValue: string
): hl7V3.PatientPrescriptionReleaseRequestWrapper {
  const hl7Id = new hl7V3.GlobalIdentifier(uuid.v4())
  const timestamp = convertMomentToHl7V3DateTime(moment.utc())
  const hl7Release = new hl7V3.PatientPrescriptionReleaseRequest(hl7Id, timestamp)
  hl7Release.author = createAuthor(practitionerRole, organization)
  const prescriptionId = new hl7V3.PrescriptionId(prescriptionIdValue)
  hl7Release.pertinentInformation = new hl7V3.PatientPrescriptionReleaseRequestPertinentInformation(prescriptionId)
  return new hl7V3.PatientPrescriptionReleaseRequestWrapper(hl7Release)
}

export function createNominatedReleaseRequest(
  practitionerRole: fhir.PractitionerRole,
  organization: fhir.Organization
): hl7V3.NominatedPrescriptionReleaseRequestWrapper {
  const hl7Id = new hl7V3.GlobalIdentifier(uuid.v4())
  const timestamp = convertMomentToHl7V3DateTime(moment.utc())
  const hl7Release = new hl7V3.NominatedPrescriptionReleaseRequest(hl7Id, timestamp)
  hl7Release.author = createAuthor(practitionerRole, organization)
  return new hl7V3.NominatedPrescriptionReleaseRequestWrapper(hl7Release)
}

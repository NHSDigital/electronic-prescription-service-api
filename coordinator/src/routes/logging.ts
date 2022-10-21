import {fhir} from "@models"
import {FhirPathBuilder, FhirPathReader} from "../../../models/common"
import {
  isBundle,
  isClaim,
  isParameters,
  isTask
} from "../utils/type-guards"

type PayloadIdentifiers = {
  nhsNumber: string
  odsNumber: string
  prescriptionShortFormId: string
}

const getIdentifiersFromBundle = (bundle: fhir.Bundle): PayloadIdentifiers => {
  const fhirPathReader = new FhirPathReader(bundle)
  const fhirPathBuilder = new FhirPathBuilder()
  const bundleResource = fhirPathBuilder.bundle()
  const patientPath = bundleResource.patient()

  const nhsNumberPath = patientPath.nhsNumber()
  const odsNumberPath = patientPath.generalPractitioner().odsOrganizationCode()
  const prescriptionShortFormIdPath = bundleResource.medicationRequest().prescriptionShortFormId()

  return {
    nhsNumber: fhirPathReader.read(nhsNumberPath),
    odsNumber: fhirPathReader.read(odsNumberPath),
    prescriptionShortFormId: fhirPathReader.read(prescriptionShortFormIdPath)
  }
}

const getIdentifiersFromClaim = (claim: fhir.Claim): PayloadIdentifiers => {
  return {
    nhsNumber: "",
    odsNumber: "",
    prescriptionShortFormId: ""
  }
}

const getIdentifiersFromParameters = (parameters: fhir.Parameters): PayloadIdentifiers => {
  return {
    nhsNumber: "",
    odsNumber: "",
    prescriptionShortFormId: ""
  }
}

const getIdentifiersFromTask = (task: fhir.Task): PayloadIdentifiers => {
  return {
    nhsNumber: "",
    odsNumber: "",
    prescriptionShortFormId: ""
  }
}

const getPayloadIdentifiers = (payload: fhir.Bundle | fhir.Claim | fhir.Parameters | fhir.Task): PayloadIdentifiers => {
  if (isBundle(payload)) {
    return getIdentifiersFromBundle(payload)
  } else if (isClaim(payload)) {
    return getIdentifiersFromClaim(payload)
  } else if (isParameters(payload)) {
    return getIdentifiersFromParameters(payload)
  } else if (isTask(payload)) {
    return getIdentifiersFromTask(payload)
  } else {
    return {
      nhsNumber: "NotProvided",
      odsNumber: "NotProvided",
      prescriptionShortFormId: "NotProvided"
    }
  }
}

export {getPayloadIdentifiers}
export type {PayloadIdentifiers}

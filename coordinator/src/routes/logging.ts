import {FhirPathBuilder, FhirPathReader} from "../../../models/common"
import {fhir} from "../../../models"
import {
  isBundle,
  isClaim,
  isParameters,
  isTask
} from "../utils/type-guards"

const VALUE_NOT_PROVIDED = "NotProvided"

type PayloadIdentifiers = {
  payloadIdentifier: string
  patientNhsNumber: string
  senderOdsCode: string
  prescriptionShortFormId: string
}

interface PathBuilder {
  getPayloadIdentifier(): string
  getNhsNumber(): string
  getOdsCode(): string
  getPrescriptionNumber(): string
}

const bundlePathBuilder: PathBuilder = {
  getPayloadIdentifier(): string {
    const builder = new FhirPathBuilder()
    const resource = builder.bundle()
    return resource.identifier()
  },
  getNhsNumber(): string {
    const builder = new FhirPathBuilder()
    const resource = builder.bundle()
    const patientPath = resource.patient()
    return patientPath.nhsNumber()
  },
  getOdsCode(): string {
    const builder = new FhirPathBuilder()
    const resource = builder.bundle()
    return resource.messageHeader().sender().identifier()
  },
  getPrescriptionNumber(): string {
    const builder = new FhirPathBuilder()
    const resource = builder.bundle()
    return resource.medicationRequest().prescriptionShortFormId()
  }
}

const claimPathBuilder: PathBuilder = {
  getPayloadIdentifier(): string {
    const builder = new FhirPathBuilder()
    const resource = builder.claim()
    return resource.identifier()
  },
  getNhsNumber(): string {
    const builder = new FhirPathBuilder()
    const resource = builder.claim()
    return resource.patient().nhsNumber()
  },
  getOdsCode(): string {
    // TODO: Check if https://nhsd-jira.digital.nhs.uk/browse/AEA-2638 changes anything
    const builder = new FhirPathBuilder()
    const resource = builder.claim()
    return resource.organization().odsCode()
  },
  getPrescriptionNumber(): string {
    const builder = new FhirPathBuilder()
    const resource = builder.claim()
    return resource.prescription().shortFormId()
  }
}

// TODO: Add examples for single patient and bulk release
const parametersPathBuilder: PathBuilder = {
  getPayloadIdentifier(): string {
    return "" // Not available for Parameters type resources
  },
  getNhsNumber(): string {
    return "" // Not available for release request
  },
  getOdsCode(): string {
    const builder = new FhirPathBuilder()
    const resource = builder.parameters()
    return resource.owner().odsCode()
  },
  getPrescriptionNumber(): string {
    const builder = new FhirPathBuilder()
    const resource = builder.parameters()
    return resource.prescription().shortFormId()
  }
}

const taskPathBuilder: PathBuilder = {
  getPayloadIdentifier(): string {
    const builder = new FhirPathBuilder()
    const resource = builder.task()
    return resource.identifier()
  },
  getNhsNumber(): string {
    const builder = new FhirPathBuilder()
    const resource = builder.task()
    return resource.nhsNumber()
  },
  getOdsCode(): string {
    const builder = new FhirPathBuilder()
    const resource = builder.task()
    return resource.requester()
  },
  getPrescriptionNumber(): string {
    const builder = new FhirPathBuilder()
    const resource = builder.task()
    return resource.prescriptionShortFormId()
  }
}

const getPathBuilder = <T extends fhir.Resource>(payload: T): PathBuilder => {
  if (isBundle(payload)) {
    return bundlePathBuilder
  } else if (isClaim(payload)) {
    return claimPathBuilder
  } else if (isParameters(payload)) {
    return parametersPathBuilder
  } else if (isTask(payload)) {
    return taskPathBuilder
  } else {
    throw "Unsupported payload type"
  }
}

const readValueFromFhirPath = (reader: FhirPathReader, fhirPath: string): string => {
  if (fhirPath) return reader.read(fhirPath)
  else return VALUE_NOT_PROVIDED
}

const getPayloadIdentifiers = <T extends fhir.Resource>(payload: T): PayloadIdentifiers => {
  const reader = new FhirPathReader(payload)
  const builder = getPathBuilder(payload)

  return {
    payloadIdentifier: readValueFromFhirPath(reader, builder.getPayloadIdentifier()),
    patientNhsNumber: readValueFromFhirPath(reader, builder.getNhsNumber()),
    senderOdsCode: readValueFromFhirPath(reader, builder.getOdsCode()),
    prescriptionShortFormId: readValueFromFhirPath(reader, builder.getPrescriptionNumber())
  }
}

export {getPayloadIdentifiers}
export type {PayloadIdentifiers}

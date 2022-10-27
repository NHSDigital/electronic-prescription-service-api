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
  patientNhsNumber: string
  senderOdsCode: string
  prescriptionShortFormId: string
}

interface PathBuilder {
  getNhsNumber(): string
  getOdsCode(): string
  getPrescriptionNumber(): string
}

const bundlePathBuilder: PathBuilder = {
  getNhsNumber(): string {
    const fhirPathBuilder = new FhirPathBuilder()
    const bundleResource = fhirPathBuilder.bundle()
    const patientPath = bundleResource.patient()
    return patientPath.nhsNumber()
  },
  getOdsCode(): string {
    const fhirPathBuilder = new FhirPathBuilder()
    const bundleResource = fhirPathBuilder.bundle()
    return bundleResource.messageHeader().sender().identifier()
  },
  getPrescriptionNumber(): string {
    const fhirPathBuilder = new FhirPathBuilder()
    const bundleResource = fhirPathBuilder.bundle()
    return bundleResource.medicationRequest().prescriptionShortFormId()
  }
}

const claimPathBuilder: PathBuilder = {
  getNhsNumber(): string {
    const builder = new FhirPathBuilder()
    const resource = builder.claim()
    return resource.patient().nhsNumber()
  },
  getOdsCode(): string {
    return "" // TODO: Where to get this one?
  },
  getPrescriptionNumber(): string {
    const builder = new FhirPathBuilder()
    const resource = builder.claim()
    return resource.prescription().shortFormId()
  }
}

const parametersPathBuilder: PathBuilder = {
  getNhsNumber(): string {
    return ""
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
    patientNhsNumber: readValueFromFhirPath(reader, builder.getNhsNumber()),
    senderOdsCode: readValueFromFhirPath(reader, builder.getOdsCode()),
    prescriptionShortFormId: readValueFromFhirPath(reader, builder.getPrescriptionNumber())
  }
}

export {getPayloadIdentifiers}
export type {PayloadIdentifiers}

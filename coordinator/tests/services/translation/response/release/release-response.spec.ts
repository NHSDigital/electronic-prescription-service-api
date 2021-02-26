import {
  createBundleResources, createInnerBundle,
  createOuterBundle
} from "../../../../../src/services/translation/response/release/release-response"
import {readXmlStripNamespace} from "../../../../../src/services/serialisation/xml"
import * as LosslessJson from "lossless-json"
import * as fs from "fs"
import * as path from "path"
import {getUniqueValues} from "../../../../../src/services/validation/util"
import {toArray} from "../../../../../src/services/translation/common"
import * as hl7V3 from "../../../../../src/models/hl7-v3"

describe("outer bundle", () => {
  const result = createOuterBundle(getExamplePrescriptionReleaseResponse())
  console.log(LosslessJson.stringify(result))

  test("contains id", () => {
    expect(result.id).toBeTruthy()
  })

  test("contains meta with correct value", () => {
    expect(result.meta).toEqual({
      lastUpdated: "2013-12-10T17:22:07+00:00"
    })
  })

  test("contains identifier with correct value", () => {
    expect(result.identifier).toEqual({
      system: "https://tools.ietf.org/html/rfc4122",
      value: "285e5cce-8bc8-a7be-6b05-675051da69b0"
    })
  })

  test("contains type with correct value", () => {
    expect(result.type).toEqual("searchset")
  })

  test("contains total with correct value", () => {
    expect(result.total).toEqual(1)
  })

  test("contains entry containing only bundles", () => {
    const resourceTypes = result.entry.map(entry => entry.resource.resourceType)
    expect(getUniqueValues(resourceTypes)).toEqual(["Bundle"])
  })

  describe("when the release response message contains only old format prescriptions", () => {
    const examplePrescriptionReleaseResponse = getExamplePrescriptionReleaseResponse()
    toArray(examplePrescriptionReleaseResponse.component)
      .forEach(component => component.templateId._attributes.extension = "PORX_MT122003UK30")
    const result = createOuterBundle(examplePrescriptionReleaseResponse)

    test("contains total with correct value", () => {
      expect(result.total).toEqual(0)
    })

    test("contains entry which is empty", () => {
      expect(result.entry).toHaveLength(0)
    })
  })
})

describe("inner bundle", () => {
  const result = createInnerBundle(getExampleParentPrescription(), "ReleaseRequestId")
  console.log(LosslessJson.stringify(result))

  test("contains id", () => {
    expect(result.id).toBeTruthy()
  })

  test("contains meta with correct value", () => {
    expect(result.meta).toEqual({
      lastUpdated: "2013-11-21T12:11:00+00:00"
    })
  })

  test("contains identifier with correct value", () => {
    expect(result.identifier).toEqual({
      system: "https://tools.ietf.org/html/rfc4122",
      value: "83df678d-daa5-1a24-9776-14806d837ca7"
    })
  })

  test("contains type with correct value", () => {
    expect(result.type).toEqual("message")
  })

  test("contains entry", () => {
    expect(result.entry.length).toBeGreaterThan(0)
  })
})

describe("bundle resources", () => {
  const result = createBundleResources(getExampleParentPrescription(), "ReleaseRequestId")
  console.log(LosslessJson.stringify(result))

  test("contains MessageHeader", () => {
    const messageHeader = result.filter(resource => resource.resourceType === "MessageHeader")
    expect(messageHeader).toHaveLength(1)
  })

  test("first element is MessageHeader", () => {
    expect(result[0].resourceType).toEqual("MessageHeader")
  })

  test("contains Patient", () => {
    const patients = result.filter(resource => resource.resourceType === "Patient")
    expect(patients).toHaveLength(1)
  })

  test("contains PractitionerRoles", () => {
    const practitionerRoles = result.filter(resource => resource.resourceType === "PractitionerRole")
    expect(practitionerRoles).toHaveLength(2)
  })

  test("contains Practitioners", () => {
    const practitioners = result.filter(resource => resource.resourceType === "Practitioner")
    expect(practitioners).toHaveLength(2)
  })

  test("contains HealthcareServices", () => {
    const healthcareServices = result.filter(resource => resource.resourceType === "HealthcareService")
    expect(healthcareServices).toHaveLength(2)
  })

  test("contains Locations", () => {
    const locations = result.filter(resource => resource.resourceType === "Location")
    expect(locations).toHaveLength(2)
  })

  test("contains Organization", () => {
    const organizations = result.filter(resource => resource.resourceType === "Organization")
    expect(organizations).toHaveLength(1)
  })

  test("contains MedicationRequests", () => {
    const medicationRequest = result.filter(resource => resource.resourceType === "MedicationRequest")
    expect(medicationRequest).toHaveLength(4)
  })
})

export function getExamplePrescriptionReleaseResponse(): hl7V3.PrescriptionReleaseResponse {
  const exampleStr = fs.readFileSync(path.join(__dirname, "release_success.xml"), "utf8")
  const exampleObj = readXmlStripNamespace(exampleStr)
  return exampleObj.PORX_IN070101UK31.ControlActEvent.subject.PrescriptionReleaseResponse
}

function getExampleParentPrescription(): hl7V3.ParentPrescription {
  return toArray(getExamplePrescriptionReleaseResponse().component)[0].ParentPrescription
}

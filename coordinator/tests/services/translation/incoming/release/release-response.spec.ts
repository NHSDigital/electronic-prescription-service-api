import {
  createBundleResources,
  createOuterBundle
} from "../../../../../src/services/translation/incoming/release/release-response"
import {readXml} from "../../../../../src/services/serialisation/xml"
import {ParentPrescription} from "../../../../../src/models/hl7-v3/hl7-v3-prescriptions"
import * as LosslessJson from "lossless-json"
import * as fs from "fs"
import * as path from "path"
import {PrescriptionReleaseResponse} from "../../../../../src/models/hl7-v3/hl7-v3-release"
import {getUniqueValues} from "../../../../../src/services/validation/util"
import {toArray} from "../../../../../src/services/translation/common"

describe("outer bundle", () => {
  const result = createOuterBundle(getExamplePrescriptionReleaseResponse())
  console.log(LosslessJson.stringify(result))

  test("contains only bundles", () => {
    const resourceTypes = result.entry.map(entry => entry.resource.resourceType)
    expect(getUniqueValues(resourceTypes)).toEqual(["Bundle"])
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

function getExamplePrescriptionReleaseResponse(): PrescriptionReleaseResponse {
  const exampleStr = fs.readFileSync(path.join(__dirname, "release_success.xml"), "utf8")
  const exampleObj = readXml(exampleStr)
  return exampleObj["hl7:PORX_IN070101UK31"]["hl7:ControlActEvent"]["hl7:subject"]["PrescriptionReleaseResponse"]
}

function getExampleParentPrescription(): ParentPrescription {
  return toArray(getExamplePrescriptionReleaseResponse().component)[0].ParentPrescription
}

import * as fhir from "../fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import * as fs from "fs"
import * as child from "child_process"
import moment from "moment"

const prescriptionIds = child.execSync("poetry run resources/generate_prescription_ids.py")
  .toString()
  .split("\n")

const prescriptionId = prescriptionIds[0]
const shortPrescriptionId = prescriptionIds[1]

export class Case {
  description: string
  request: fhir.Bundle

  constructor(description: string, requestFile: string) {
    const requestString = fs.readFileSync(requestFile, "utf-8")

    const requestJson = LosslessJson.parse(requestString)

    this.updateIdsAndAuthoredOn(requestJson)

    this.description = description
    this.request = requestJson
  }

  private updateIdsAndAuthoredOn(requestJson: fhir.Bundle) {
    requestJson.identifier.value = prescriptionId
    const medicationRequests = (requestJson.entry
      .map(entry => entry.resource)
      .filter(resource => resource.resourceType === "MedicationRequest") as Array<fhir.MedicationRequest>)
  
    medicationRequests.forEach(medicationRequest => {
      medicationRequest.authoredOn = moment.utc().toISOString(true)
      medicationRequest.groupIdentifier.value = shortPrescriptionId
    })
  }
}
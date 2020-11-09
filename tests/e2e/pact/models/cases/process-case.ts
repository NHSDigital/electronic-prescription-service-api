import * as fhir from "../fhir/fhir-resources"
import {Case} from "./case"
import {exampleFiles} from "../../services/example-files-fetcher"
import fs from "fs"
import * as child from "child_process"
import moment from "moment"

const prescriptionIds = child.execSync("poetry run python resources/generate_prescription_ids.py")
  .toString()
  .split("\n")

const prescriptionId = prescriptionIds[0]
const shortPrescriptionId = prescriptionIds[1]

export class ProcessCase extends Case {
  description: string
  request: fhir.Bundle
  prepareResponse : fhir.Parameters

  constructor(description: string, requestFile: string) {
    super(description, requestFile)

    const processRequest = exampleFiles.find(exampleFile => exampleFile.path === requestFile)

    const prepareResponse = exampleFiles.find(exampleFile => 
      exampleFile.dir === processRequest.dir
      && exampleFile.number === processRequest.number
      && exampleFile.endpoint === "prepare"
      && exampleFile.isResponse)

    this.prepareResponse = JSON.parse(fs.readFileSync(prepareResponse.path, "utf-8"))
  }

  /* Replace ids and authored on to create valid, easily traceable prescriptions in Spine int */
  updateIdsAndAuthoredOn(requestJson: fhir.Bundle) : void {
    if (process.env.APIGEE_ENVIRONMENT !== "int") {
      return
    }

    requestJson.identifier.value = prescriptionId
    const medicationRequests = (requestJson.entry
      .map(entry => entry.resource)
      .filter(resource => resource.resourceType === "MedicationRequest") as Array<fhir.MedicationRequest>)
  
    const authoredOn = moment.utc().toISOString(true)

    medicationRequests.forEach(medicationRequest => {
      medicationRequest.authoredOn = authoredOn
      medicationRequest.groupIdentifier.value = shortPrescriptionId
    })
  }
}
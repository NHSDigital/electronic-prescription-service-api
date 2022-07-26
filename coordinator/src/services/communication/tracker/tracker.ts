import {hl7V3, spine} from "@models"
import pino from "pino"
import {spineClient} from "../spine-client"
import {extractHl7v3PrescriptionFromMessage} from "./tracker-response-parser"

export async function track(request: spine.GetPrescriptionMetadataRequest, logger: pino.Logger)
: Promise<hl7V3.ParentPrescription> {
  const trackerResponse = await spineClient.track(request, logger)
  return extractHl7v3PrescriptionFromMessage(trackerResponse.body, logger)
}

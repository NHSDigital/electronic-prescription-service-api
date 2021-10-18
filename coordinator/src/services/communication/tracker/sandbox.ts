import {TrackerClient} from "."
import pino from "pino"
import Hapi from "@hapi/hapi"

export class SandboxTrackerClient implements TrackerClient {
  getPrescription(
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    prescriptionId: string, headers: Hapi.Util.Dictionary<string>, logger: pino.Logger
  ): Promise<unknown> {
    return Promise.resolve({
      version: "2",
      reason: "",
      statusCode: "0",
      "D7AC09-A99968-4BA59C": {
        "prescriptionStatus": "With Dispenser - Active",
        "lastEventDate": "20210908130924",
        "prescriptionIssueDate": "20210908130845",
        "prescriptionDownloadDate": "20210908130916",
        "prescriptionDispensedDate": "20210908",
        "prescriptionClaimedDate": "",
        "prescriptionLastIssueDispensedDate": "False",
        "patientNhsNumber": "9449305552",
        "epsVersion": "R2",
        "pendingCancellations": "False",
        "prescriptionTreatmentType": "Acute Prescription",
        "repeatInstance": {
          "currentIssue": "1",
          "totalAuthorised": "1"
        },
        "prescriber": {
          "name": "SOMERSET BOWEL CANCER SCREENING CENTRE",
          "address": "MUSGROVE PARK HOSPITAL, TAUNTON, TA1 5DA",
          "phone": "01823333444",
          "ods": "A99968"
        },
        "nominatedPharmacy": {
          "name": "",
          "address": "",
          "phone": "",
          "ods": "FH542"
        },
        "dispensingPharmacy": {
          "name": "FIVE STAR HOMECARE LEEDS LTD",
          "address": "UNIT 16C DEANFIELD MILLS, ASQUITH AVENUE, MORLEY, LS27 9QS",
          "phone": "",
          "ods": "VNFKT"
        },
        "lineItems": {
          "A54219B8-F741-4C47-B662-E4F8DFA49AB6": {
            "description": "Methotrexate 10mg/0.2ml solution for injection pre-filled syringes",
            "quantity": "1",
            "uom": "pre-filled disposable injection",
            "dosage": "10 milligram, Inject, Subcutaneous route, once weekly",
            "itemStatus": "Dispensed",
            "code": "15517911000001104"
          }
        }
      }
    })
  }
}

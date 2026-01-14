import {TrackerClient} from "."
import {spine} from "@models"
import Hapi from "@hapi/hapi"
import pino from "pino"

const mockSummaryPrescriptions: Record<string, spine.SummaryPrescription> = {
  "2D35F7-ZA0448-11E88Z": {
    lastEventDate: "20180422095703",
    prescriptionIssueDate: "20180117095703",
    patientNhsNumber: "9912003489",
    epsVersion: "R2",
    repeatInstance: {
      currentIssue: "2",
      totalAuthorised: "6"
    },
    pendingCancellations: "False",
    prescriptionTreatmentType: "Repeat Dispensing",
    prescriptionStatus: "Dispensed",
    lineItems: {
      "30b7e9cf-6f42-40a8-84c1-e61ef638eee2": "Perindopril erbumine 2mg tablets",
      "636f1b57-e18c-4f45-acae-2d7db86b6e1e": "Metformin 500mg modified-release tablets"
    }
  },
  "ABC5F7-ZA0448-77E88X": {
    lastEventDate: "20180319115010",
    prescriptionIssueDate: "20180319101307",
    patientNhsNumber: "9912003489",
    epsVersion: "R2",
    repeatInstance: {
      currentIssue: "1",
      totalAuthorised: "1"
    },
    pendingCancellations: "False",
    prescriptionTreatmentType: "Acute Prescription",
    prescriptionStatus: "Dispensed",
    lineItems: {
      "636f1b57-e18c-4f45-acae-2d7db86b6e1e": "Hydrocortisone 0.5% cream"
    }
  }
}

const mockDetailedPrescriptions: Record<string, spine.DetailPrescription> = {
  "D7AC09-A99968-4BA59C": {
    prescriptionStatus: "With Dispenser - Active",
    lastEventDate: "20210908130924",
    prescriptionIssueDate: "20210908130845",
    prescriptionDownloadDate: "20210908130916",
    prescriptionDispensedDate: "20210908",
    prescriptionClaimedDate: "",
    prescriptionLastIssueDispensedDate: "False",
    patientNhsNumber: "9449305552",
    epsVersion: "R2",
    pendingCancellations: "False",
    prescriptionTreatmentType: "Acute Prescription",
    repeatInstance: {
      currentIssue: "1",
      totalAuthorised: "1"
    },
    prescriber: {
      name: "SOMERSET BOWEL CANCER SCREENING CENTRE",
      address: "MUSGROVE PARK HOSPITAL, TAUNTON, TA1 5DA",
      phone: "01823333444",
      ods: "A99968"
    },
    nominatedPharmacy: {
      name: "",
      address: "",
      phone: "",
      ods: "FH542"
    },
    dispensingPharmacy: {
      name: "FIVE STAR HOMECARE LEEDS LTD",
      address: "UNIT 16C DEANFIELD MILLS, ASQUITH AVENUE, MORLEY, LS27 9QS",
      phone: "",
      ods: "VNFKT"
    },
    lineItems: {
      "a54219b8-f741-4c47-b662-e4f8dfa49ab6": {
        description: "Methotrexate 10mg/0.2ml solution for injection pre-filled syringes",
        quantity: "1",
        uom: "pre-filled disposable injection",
        dosage: "10 milligram, Inject, Subcutaneous route, once weekly",
        itemStatus: "Dispensed",
        code: "15517911000001104"
      }
    }
  }
}

export class SandboxTrackerClient implements TrackerClient {
  getPrescriptionsByPatientId(
    // Omitting these parameters seems to be causing Jest to run out of memory (??? I don't understand how or why ???)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _patientId: string, _businessStatus: string, _headers: Hapi.Utils.Dictionary<string>, _logger: pino.Logger
  ): Promise<spine.SummaryTrackerResponse> {
    return Promise.resolve({
      version: "1",
      reason: "",
      statusCode: "0",
      prescriptions: mockSummaryPrescriptions
    })
  }

  getPrescriptionById(): Promise<spine.DetailTrackerResponse> {
    return Promise.resolve({
      version: "2",
      reason: "",
      statusCode: "0",
      prescriptions: mockDetailedPrescriptions
    })
  }
}

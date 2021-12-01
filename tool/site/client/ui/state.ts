import Cookies from "js-cookie"
import {Prescription, SoftwareVersion} from "./view-models"
import examplePrescriptions from "../data/prescriptions"

const payloads: Array<string> = []

const validatorPackages: Array<SoftwareVersion> = []

export const pageData = {
  examples: [
    // todo: commented out prescriptions either add missing prescription or fix issues in send
    new Prescription(
      "1",
      "Primary Care - Acute (nominated)",
      examplePrescriptions.PRIMARY_CARE_ACUTE_NOMINATED
    ),
    //new Prescription("2", "Primary Care - Repeat Dispensing (nominated)", PRIMARY_CARE_REPEAT_DISPENSING_NOMINATED),
    new Prescription(
      "3",
      "Primary Care - Repeat Prescribing (nominated)",
      examplePrescriptions.PRIMARY_CARE_REPEAT_PRESCRIBING_NOMINATED
    ),
    new Prescription(
      "4",
      "Secondary Care - Acute (nominated)",
      examplePrescriptions.SECONDARY_CARE_COMMUNITY_ACUTE_NOMINATED
    ),
    new Prescription(
      "5",
      "Secondary Care - Acute",
      examplePrescriptions.SECONDARY_CARE_COMMUNITY_ACUTE_NON_NOMINATED
    ),
    new Prescription("6",
      "Secondary Care - Repeat Dispensing (nominated)",
      examplePrescriptions.SECONDARY_CARE_REPEAT_DISPENSING_NOMINATED),
    //new Prescription(.., SECONDARY_CARE_REPEAT_PRESCRIBING_NOMINATED),
    new Prescription(
      "8",
      "Homecare - Acute (nominated)",
      examplePrescriptions.HOMECARE_ACUTE_NOMINATED
    ),
    //new Prescription("9", "Homecare - Repeat Dispensing (nominated)", HOMECARE_REPEAT_DISPENSING_NOMINATED),
    //new Prescription("10", "Homecare - Repeat Prescribing (nominated)", HOMECARE_REPEAT_PRESCRIBING_NOMINATED),
    new Prescription("custom", "Custom", null)
  ],
  environment: "Sandbox",
  mode: "home",
  isHome: true,
  isLogin: false,
  isLoad: false,
  baseUrl: "/",
  loggedIn: Cookies.get("Access-Token-Set") === "true",
  selectedExampleId: "1",
  showCustomExampleInput: false,
  prescriptionId: new URLSearchParams(window.location.search).get(
    "prescription_id"
  ),
  payloads: payloads,
  validatorPackages: validatorPackages
}

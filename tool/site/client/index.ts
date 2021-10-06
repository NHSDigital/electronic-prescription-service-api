import "./site.css"
import Cookies from "js-cookie"
import * as fhirExtension from "./models/extension"
import {Bundle, BundleEntry, ContentReferencePayload, ContentStringPayload, OperationOutcome} from "./models"
import {createDispenseRequest} from "./transformers/dispense-notification"
import {createCancellation} from "./transformers/cancellation"
import {
  getCanceller,
  getCommunicationRequestResources,
  getMedicationRequestResources,
  getOrganizationResources,
  getPatientResources,
  getPractitionerResources,
  getPractitionerRoleResources,
  getPrescriber
} from "./parsers/read/bundle-parser"
import {
  addError,
  bindPageData,
  getOdsCode,
  getReleaseRequest,
  pageData,
  parseMetadataResponse,
  resetErrors,
  resetPageData
} from "./ui/state"
import {APIResponse, PrescriptionAction} from "./ui/view-models"
import {makeRequest} from "./api/make-request"
import {initialiseTestPack} from "./importers/test-pack"
import {
  sanitiseProdTestData,
  updateBundleIds,
  updateNominatedPharmacy,
  updateValidityPeriodIfRepeatDispensing
} from "./parsers/write/bundle-parser"

const customWindow = window as Record<string, any>

customWindow.sendLoadRequest = function () {
  resetErrors()
  resetPageData("edit")
}

customWindow.updateAuthMethod = function (authMethod: string) {
  const response = makeRequest(
    "POST",
    `${pageData.baseUrl}change-auth`,
    JSON.stringify({authMethod: authMethod})
  )
  window.location.href = response.redirectUri
}

customWindow.getEditRequest = function (previousOrNext: string) {
  try {
    const prescriptionId =
      previousOrNext === "previous"
        ? pageData.previous_prescription_id
        : pageData.next_prescription_id
    const response = makeRequest(
      "GET",
      `${pageData.baseUrl}prescribe/edit?prescription_id=${prescriptionId}`
    )
    pageData.previous_prescription_id = Cookies.get("Previous-Prescription-Id")
    pageData.next_prescription_id = Cookies.get("Next-Prescription-Id")
    resetPageData("sign")
    pageData.prescription = getPrescriptionSummary(response.bundle)
  } catch (e) {
    console.log(e)
    addError("Communication error")
  }
}

customWindow.sendEditRequest = function () {
  resetErrors()
  try {
    let bundles = getPayloads()
    const numberOfCopies = getNumberOfCopies()
    bundles = createCopies(bundles, parseInt(numberOfCopies))
    bundles.forEach(bundle => {
      updateBundleIds(bundle)
      updateValidityPeriodIfRepeatDispensing(bundle)
      updateNominatedPharmacy(bundle, getOdsCode())
      sanitiseProdTestData(bundle)
    })
    const response = makeRequest(
      "POST",
      `${pageData.baseUrl}prescribe/edit`,
      JSON.stringify(bundles)
    )
    resetPageData("sign")
    pageData.prescription = getPrescriptionSummary(response.bundle)
    response.errors.forEach((error: any) => addError(error))
  } catch (e) {
    console.log(e)
    addError("Failed to read prescription(s)")
  }
}

customWindow.sendSignRequest = function () {
  resetErrors()
  try {
    const response = makeRequest(
      "POST",
      `${pageData.baseUrl}prescribe/sign`,
      JSON.stringify({})
    )
    if (response.prepareErrors) {
      const prepareErrors: OperationOutcome[] = response.prepareErrors
      prepareErrors
        .flatMap(error => error.issue)
        .filter(issue => issue.severity === "error")
        .filter(issue => !issue.diagnostics.startsWith("Unable to find matching profile for urn:uuid:"))
        .map(issue => issue.diagnostics)
        .forEach(diagnostic => addError(diagnostic))
    } else {
      window.location.href = response.redirectUri
    }
  } catch (e) {
    console.log(e)
    addError("Communication error")
  }
}

customWindow.sendPrescriptionRequest = function () {
  resetErrors()
  try {
    const response = makeRequest("POST", `${pageData.baseUrl}prescribe/send`, {})
    pageData.signResponse = null
    if (response.prescription_ids.length > 1) {
      pageData.sendBulkResponse = response.success_list
    } else {
      pageData.sendResponse = {
        prescriptionId: response.prescription_id,
        success: response.success,
        fhirRequest: response.request,
        hl7Request: response.request_xml,
        hl7Response: response.response_xml,
        fhirResponse: response.response
      }
    }
  } catch (e) {
    console.log(e)
    addError("Communication error")
  }
}

customWindow.copySuccessfulPrescriptionIds = function () {
  const prescriptionIds = pageData.sendBulkResponse
    .filter(entry => entry.success)
    .map(entry => entry.prescription_id)
    .join("\n")
  //TODO - test in multiple browsers
  navigator.clipboard.writeText(prescriptionIds)
}

customWindow.sendCancelRequest = function () {
  try {
    const prescriptionId = Cookies.get("Current-Prescription-Id")
    const prescription = makeRequest(
      "GET",
      `${pageData.baseUrl}prescribe/edit?prescription_id=${prescriptionId}`
    )
    resetPageData("cancel")
    const cancellation = createCancellation(prescription.bundle)
    const response = makeRequest(
      "POST",
      `${pageData.baseUrl}prescribe/cancel`,
      JSON.stringify(cancellation)
    )
    pageData.cancelResponse = {
      prescriptionId: response.prescription_id,
      success: response.success,
      prescriber: getPrescriber(
        response.response,
        response.success
      ),
      canceller: getCanceller(
        response.response,
        response.success
      ),
      fhirRequest: response.request,
      hl7Request: response.request_xml,
      hl7Response: response.response_xml,
      fhirResponse: response.response
    }
  } catch (e) {
    console.log(e)
    addError("Communication error")
  }
}

customWindow.sendReleaseRequest = function () {
  try {
    const request = getReleaseRequest()
    const response = makeRequest(
      "POST",
      `${pageData.baseUrl}dispense/release`,
      JSON.stringify(request)
    )
    pageData.showCustomPharmacyInput = false
    pageData.releaseResponse = {
      success: response.success,
      fhirRequest: response.request,
      hl7Request: response.request_xml,
      hl7Response: response.response_xml,
      fhirResponse: response.response
    }
    pageData.releaseResponse.prescriptions = response.success && response.response.entry
      ? response.response.entry.map(function (entry: BundleEntry) {
        const bundle = entry.resource as Bundle
        const originalShortFormId = getMedicationRequestResources(bundle)[0]
          .groupIdentifier.value
        return {id: originalShortFormId}
      })
      : null
  } catch (e) {
    console.log(e)
    addError("Communication error")
  }
}

customWindow.sendDispenseRequest = function () {
  try {
    const prescriptionId = Cookies.get("Current-Prescription-Id")
    const prescription = makeRequest(
      "GET",
      `${pageData.baseUrl}prescribe/edit?prescription_id=${prescriptionId}`
    )
    const dispenseRequest = createDispenseRequest(prescription.bundle)
    const response = makeRequest(
      "POST",
      `${pageData.baseUrl}dispense/dispense`,
      JSON.stringify(dispenseRequest)
    )
    pageData.dispenseResponse = {
      success: response.success,
      fhirRequest: response.request,
      hl7Request: response.request_xml,
      hl7Response: response.response_xml,
      fhirResponse: response.response
    }
  } catch (e) {
    console.log(e)
    addError("Communication error")
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
window.onerror = function (msg, url, line, col, error) {
  // todo: fix cancellation page checkbox, prevent rivets from publishing checkbox values
  if (
    pageData.mode === "cancel" &&
    msg === "Uncaught TypeError: Cannot read property 'length' of undefined"
  ) {
    return true
  }
  addError(
    "Unhandled error: " + msg + " at " + url + ":" + line + " col " + col
  )
  return true
}

function isContentStringPayload(payload: ContentStringPayload | ContentReferencePayload): payload is ContentStringPayload {
  return "contentString" in payload
}

function getFormattedDate() {
  const date = new Date()
  const year = date.getFullYear()
  const month = ("0" + (date.getMonth() + 1)).slice(-2)
  const day = date.getDate()
  return `${year}-${month}-${day}`
}

function getPrescriptionSummary(payload: Bundle) {
  const patient = getPatientResources(payload)[0]
  const practitioner = getPractitionerResources(payload)[0]
  const practitionerRole = getPractitionerRoleResources(payload)[0]
  const organizations = getOrganizationResources(payload)
  const prescribingOrganization = organizations[0] // todo: add logic to handle primary/secondary-care
  const parentOrganization = organizations[0]
  const medicationRequests = getMedicationRequestResources(payload)

  const communicationRequests = getCommunicationRequestResources(payload)
  const patientInstructions = communicationRequests
    .flatMap(communicationRequest => communicationRequest.payload)
    .filter(Boolean)
    .filter(isContentStringPayload)
    .map(payload => payload.contentString)
    .join("\n")

  const currentDate = getFormattedDate()
  const startDate =
    medicationRequests[0].dispenseRequest.validityPeriod?.start ??
    new Date().toISOString().slice(0, 10)
  const medicationRepeatInformation = medicationRequests[0].extension.filter(
    extension => extension.url === "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation"
  )
  const numberOfRepeatPrescriptionsIssuedExtension = medicationRepeatInformation.length
    ? medicationRepeatInformation[0].extension.filter(
      extension => extension.url === "numberOfRepeatPrescriptionsIssued"
    ) as Array<fhirExtension.UnsignedIntExtension>
    : null
  const numberOfRepeatPrescriptionsIssued =
    medicationRepeatInformation.length &&
      !numberOfRepeatPrescriptionsIssuedExtension.length
      ? 0
      : medicationRepeatInformation.length
        ? numberOfRepeatPrescriptionsIssuedExtension[0].valueUnsignedInt.valueOf()
        : null
  return {
    id: medicationRequests[0].groupIdentifier.value,
    author: {
      startDate: startDate
    },
    authoredOn: currentDate,
    patientInstructions: patientInstructions,
    repeatNumber: Number.isInteger(numberOfRepeatPrescriptionsIssued)
      ? (numberOfRepeatPrescriptionsIssued as number) + 1
      : null,
    patient: patient,
    practitioner: practitioner,
    practitionerRole: practitionerRole,
    prescribingOrganization: prescribingOrganization,
    parentOrganization: parentOrganization,
    medicationRequests: medicationRequests
  }
}

function getPayloads() {
  const isCustom = pageData.selectedExampleId === "custom"
  const filePayloads = pageData.payloads
  const textPayloads = [(document.getElementById("prescription-textarea") as HTMLTextAreaElement).value]
  try {
    const payloads = filePayloads
      .concat(textPayloads)
      .filter(Boolean)
      .map(payload => JSON.parse(payload))
    return isCustom
      ? payloads
      : [
        pageData.examples.filter(function (example) {
          return example.id === pageData.selectedExampleId
        })[0].message
      ]
  } catch (e) {
    addError("Unable to parse custom prescription(s)")
  }
}

function getNumberOfCopies() {
  return (document.getElementById("prescription-copies-input") as HTMLInputElement).value ?? "1"
}

function createCopies(bundles: Array<Bundle>, numberOfCopies: number) {
  const createNewInstance = (bundle: Bundle): Bundle => JSON.parse(JSON.stringify(bundle))
  return Array(numberOfCopies)
    .fill([...bundles])
    .reduce((previous, current) => previous.concat(current))
    .map(bundle => createNewInstance(bundle))
}

customWindow.doPrescriptionAction = function (select: HTMLInputElement) {
  const value = select.value
  const prescriptionId = Cookies.get("Current-Prescription-Id")
  switch (value) {
    case "cancel":
      window.open(
        `${pageData.baseUrl}prescribe/cancel?prescription_id=${prescriptionId}`,
        "_blank"
      )
      break
    case "release":
      window.open(
        `${pageData.baseUrl}dispense/release?prescription_id=${prescriptionId}`,
        "_blank"
      )
      break
    case "dispense":
      window.open(
        `${pageData.baseUrl}dispense/dispense?prescription_id=${prescriptionId}`,
        "_blank"
      )
      break
    default:
      return
  }
}

function setInitialState(mode: string, env: string, baseUrl: string, signResponse: APIResponse) {
  pageData.mode = mode
  pageData.environment = env
  pageData.baseUrl = baseUrl
  pageData.signResponse = signResponse
  pageData.loggedIn = pageData.loggedIn || env.endsWith("-sandbox")
}

customWindow.startApplication = async function (mode: string, env: string, baseUrl: string, signResponse: APIResponse) {
  setInitialState(mode, env, baseUrl, signResponse)
  if (pageData.mode === "release" && pageData.prescriptionId) {
    pageData.selectedReleaseId = "prescriptionId"
    resetPageData("release")
  }
  if (pageData.mode === "dispense") {
    const prescriptionId = Cookies.get("Current-Prescription-Id")
    const response = await makeRequest(
      "GET",
      `${pageData.baseUrl}prescribe/edit?prescription_id=${prescriptionId}`
    )
    pageData.prescription = getPrescriptionSummary(response.bundle)
    resetPageData("dispense")
  }
  if (
    pageData.mode === "send" &&
    !pageData.sendResponse &&
    Cookies.get("Skip-Signature-Page") === "True"
  ) {
    customWindow.sendPrescriptionRequest()
  }
  if (pageData.mode === "send") {
    if (env !== "prod") {
      pageData.actions.push(new PrescriptionAction("release", "Release"))
      pageData.actions.push(new PrescriptionAction("dispense", "Dispense"))
    }
  }
  if (pageData.mode === "cancel") {
    const prescriptionId = Cookies.get("Current-Prescription-Id")
    const response = await makeRequest(
      "GET",
      `${pageData.baseUrl}prescribe/edit?prescription_id=${prescriptionId}`
    )
    pageData.prescription = getPrescriptionSummary(response.bundle)
    resetPageData("cancel")
  }
  initialiseTestPack()
  bind()
  document.getElementById("main-content").style.display = ""
  pageData.validatorPackages = parseMetadataResponse()
}

customWindow.resetPageData = resetPageData

function bind() {
  bindPageData()
  document.getElementById("prescription-files").onchange = function (evt: InputEvent) {
    try {
      const files = (evt.target as HTMLInputElement).files
      if (!files.length) {
        return
      }
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader()
        reader.onload = event => {
          //eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          pageData.payloads.push(event.target.result)
        }
        reader.readAsText(files[i])
      }
    } catch (err) {
      console.error(err)
    }
  }
}

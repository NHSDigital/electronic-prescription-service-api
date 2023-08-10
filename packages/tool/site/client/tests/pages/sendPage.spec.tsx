import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import moxios from "moxios"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import SendPage from "../../src/pages/sendPage"
import {axiosInstance} from "../../src/requests/axiosInstance"
import {internalDev} from "../../src/services/environment"
import {readBundleFromFile} from "../messages"
import {getMedicationRequestResources} from "../../src/fhir/bundleResourceFinder"

const baseUrl = "baseUrl/"
const token = "MzQxMWJmMjUtMDNlMy00N2FiLWEyOGItMGIyYjVlNTg4ZGU3"
const context: AppContextValue = {baseUrl, environment: internalDev}

const prescriptionsUrl = `${baseUrl}prescriptions`
const sendUrl = `${baseUrl}api/prescribe/send`

const prescriptionOrder = readBundleFromFile("prescriptionOrder.json")

beforeEach(() => moxios.install(axiosInstance))

afterEach(() => moxios.uninstall(axiosInstance))

test("Displays confirmation page if single prescription is sent successfully", async () => {
  const prescriptionId = "003D4D-A99968-4C5AAJ"
  const prescription = clone(prescriptionOrder)
  prescription.id = "1"
  getMedicationRequestResources(prescription)[0].groupIdentifier.value = prescriptionId

  moxios.stubRequest(prescriptionsUrl, {
    status: 200,
    response: [prescription]
  })

  moxios.stubRequest(sendUrl, {
    status: 200,
    response: {
      results: [{
        prescription_id: prescriptionId,
        bundle_id: "1",
        request: {},
        request_xml: "XML Request",
        response: {},
        response_xml: "XML Response",
        success: true
      }]
    }
  })

  const container = await renderPage()

  await waitFor(() => screen.getByText(prescriptionId))
  expect(screen.getByText("XML Request")).toBeTruthy()
  expect(screen.getByText("XML Response")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays confirmation page if multiple prescriptions are sent successfully", async () => {
  const prescriptionId1 = "003D4D-A99968-4C5AAJ"
  const prescriptionId2 = "008070-A99968-41CD9V"
  const prescriptionId3 = "010E34-A99968-467D9Z"
  const prescription1 = clone(prescriptionOrder)
  prescription1.id = "1"
  getMedicationRequestResources(prescription1)[0].groupIdentifier.value = prescriptionId1
  const prescription2 = clone(prescriptionOrder)
  prescription2.id = "2"
  getMedicationRequestResources(prescription2)[0].groupIdentifier.value = prescriptionId2
  const prescription3 = clone(prescriptionOrder)
  prescription3.id = "3"
  getMedicationRequestResources(prescription3)[0].groupIdentifier.value = prescriptionId3

  moxios.stubRequest(prescriptionsUrl, {
    status: 200,
    response: [prescription1, prescription2, prescription3]
  })

  moxios.stubRequest(sendUrl, {
    status: 200,
    response: {
      results: [
        {
          prescription_id: prescriptionId1,
          bundle_id: "1",
          success: true
        },
        {
          prescription_id: prescriptionId2,
          bundle_id: "2",
          success: true
        },
        {
          prescription_id: prescriptionId3,
          bundle_id: "3",
          success: true
        }
      ]
    }
  })

  const container = await renderPage()

  expect(screen.getByText(prescriptionId1)).toBeTruthy()
  expect(screen.getByText(prescriptionId2)).toBeTruthy()
  expect(screen.getByText(prescriptionId3)).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Exception report button not shown if there are pending prescriptions", async () => {
  const prescriptionId1 = "003D4D-A99968-4C5AAJ"
  const prescriptionId2 = "008070-A99968-41CD9V"
  const prescriptionId3 = "010E34-A99968-467D9Z"
  const prescription1 = clone(prescriptionOrder)
  prescription1.id = "1"
  getMedicationRequestResources(prescription1)[0].groupIdentifier.value = prescriptionId1
  const prescription2 = clone(prescriptionOrder)
  prescription2.id = "2"
  getMedicationRequestResources(prescription2)[0].groupIdentifier.value = prescriptionId2
  const prescription3 = clone(prescriptionOrder)
  prescription3.id = "3"
  getMedicationRequestResources(prescription3)[0].groupIdentifier.value = prescriptionId3

  moxios.stubRequest(prescriptionsUrl, {
    status: 200,
    response: [prescription1, prescription2, prescription3]
  })

  moxios.stubRequest(sendUrl, {
    status: 200,
    response: {
      results: [
        {
          prescription_id: prescriptionId1,
          bundle_id: "1",
          success: true
        },
        {
          prescription_id: prescriptionId2,
          bundle_id: "2",
          success: "unknown"
        },
        {
          prescription_id: prescriptionId3,
          bundle_id: "3",
          success: false
        }
      ]
    }
  })

  const container = await renderPage()

  expect(screen.getByText(prescriptionId1)).toBeTruthy()
  expect(screen.getByText(prescriptionId2)).toBeTruthy()
  expect(screen.getByText(prescriptionId3)).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Exception report button shown if there are failed prescriptions", async () => {
  const prescriptionId1 = "003D4D-A99968-4C5AAJ"
  const prescriptionId2 = "008070-A99968-41CD9V"
  const prescriptionId3 = "010E34-A99968-467D9Z"
  const prescription1 = clone(prescriptionOrder)
  prescription1.id = "1"
  getMedicationRequestResources(prescription1)[0].groupIdentifier.value = prescriptionId1
  const prescription2 = clone(prescriptionOrder)
  prescription2.id = "2"
  getMedicationRequestResources(prescription2)[0].groupIdentifier.value = prescriptionId2
  const prescription3 = clone(prescriptionOrder)
  prescription3.id = "3"
  getMedicationRequestResources(prescription3)[0].groupIdentifier.value = prescriptionId3

  moxios.stubRequest(prescriptionsUrl, {
    status: 200,
    response: [prescription1, prescription2, prescription3]
  })

  moxios.stubRequest(sendUrl, {
    status: 200,
    response: {
      results: [
        {
          prescription_id: prescriptionId1,
          bundle_id: "1",
          success: true
        },
        {
          prescription_id: prescriptionId2,
          bundle_id: "2",
          success: false
        },
        {
          prescription_id: prescriptionId3,
          bundle_id: "3",
          success: false
        }
      ]
    }
  })

  const container = await renderPage()

  expect(screen.getByText(prescriptionId1)).toBeTruthy()
  expect(screen.getByText(prescriptionId2)).toBeTruthy()
  expect(screen.getByText(prescriptionId3)).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

async function renderPage() {
  const {container} = renderWithContext(<SendPage token={token}/>, context)
  await waitFor(() => screen.getByText(/Send Result/))
  return container
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

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

const baseUrl = "baseUrl/"
const token = "MzQxMWJmMjUtMDNlMy00N2FiLWEyOGItMGIyYjVlNTg4ZGU3"
const prescriptionId = "003D4D-A99968-4C5AAJ"
const context: AppContextValue = {baseUrl, environment: internalDev}

const downloadSignaturesUrl = `${baseUrl}sign/download-signatures`
const sendUrl = `${baseUrl}api/prescribe/send`

beforeEach(() => moxios.install(axiosInstance))

afterEach(() => moxios.uninstall(axiosInstance))

test.skip("Displays confirmation page if single prescription is sent successfully", async () => {
  moxios.stubRequest(downloadSignaturesUrl, {
    status: 200,
    response: {
      prescription_id: prescriptionId,
      bundle_id: "1",
      success: "unknown"
    }
  })

  moxios.stubRequest(sendUrl, {
    status: 200,
    response: {
      prescription_id: prescriptionId,
      bundle_id: "1",
      request: "JSON Request",
      request_xml: "XML Request",
      response: "JSON Response",
      response_xml: "XML Response",
      success: true
    }
  })

  const container = await renderPage()

  await waitFor(() => screen.getByText(prescriptionId))

  expect(screen.getByText(JSON.stringify("JSON Request"))).toBeTruthy()
  expect(screen.getByText("XML Request")).toBeTruthy()
  expect(screen.getByText(JSON.stringify("JSON Response"))).toBeTruthy()
  expect(screen.getByText("XML Response")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays confirmation page if multiple prescriptions are sent successfully", async () => {
  moxios.stubRequest(downloadSignaturesUrl, {
    status: 200,
    response: {
      results: [
        {
          prescription_id: "003D4D-A99968-4C5AAJ",
          success: true
        },
        {
          prescription_id: "008070-A99968-41CD9V",
          success: true
        },
        {
          prescription_id: "010E34-A99968-467D9Z",
          success: true
        }
      ]
    }
  })

  const container = await renderPage()

  expect(screen.getByText("003D4D-A99968-4C5AAJ")).toBeTruthy()
  expect(screen.getByText("008070-A99968-41CD9V")).toBeTruthy()
  expect(screen.getByText("010E34-A99968-467D9Z")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

async function renderPage() {
  const {container} = renderWithContext(<SendPage token={token}/>, context)
  await waitFor(() => screen.getByText(/Send Result/))
  return container
}

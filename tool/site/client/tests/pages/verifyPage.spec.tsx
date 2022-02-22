import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import moxios from "moxios"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import {axiosInstance} from "../../src/requests/axiosInstance"
import {internalDev} from "../../src/services/environment"
import VerifyPage from "../../src/pages/verifyPage"
import {readMessage} from "../messages/messages"

const baseUrl = "baseUrl/"
const prescriptionId = "7A9089-A83008-56A03J"
const context: AppContextValue = {baseUrl, environment: internalDev}

const releaseUrl = `${baseUrl}dispense/release/${prescriptionId}`
const verifyUrl = `${baseUrl}dispense/verify`

const releaseResponse = readMessage("releaseResponse.json")

beforeEach(() => moxios.install(axiosInstance))

afterEach(() => moxios.uninstall(axiosInstance))

test("Displays verify form when no prescription id is provided", async () => {
  const container = await renderPage()

  expect(screen.getByText("Verify prescription(s)")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays verify result when prescription id is provided", async () => {
  moxios.stubRequest(releaseUrl, {
    status: 200,
    response: releaseResponse
  })
  moxios.stubRequest(verifyUrl, {
    status: 200,
    response: {
      results: [{
        name: "0",
        success: true
      }],
      success: true,
      request: "JSON Request",
      response: "JSON Response"
    }
  })

  const container = await renderPage(prescriptionId)

  expect(screen.getByText("Verify Result")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

async function renderPage(prescriptionId?: string) {
  const {container} = renderWithContext(<VerifyPage prescriptionId={prescriptionId}/>, context)
  if (prescriptionId) {
    await waitFor(() => screen.getByText("Verify Result"))
  } else {
    await waitFor(() => screen.getByText("Verify prescription(s)"))
  }
  return container
}

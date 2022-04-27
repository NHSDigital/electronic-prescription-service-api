import {waitFor} from "@testing-library/react"
import {fireEvent, screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import moxios from "moxios"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import {axiosInstance} from "../../src/requests/axiosInstance"
import {internalDevSandbox} from "../../src/services/environment"
import DoseToTextPage from "../../src/pages/doseToTextPage"
import userEvent from "@testing-library/user-event";
import {readBundleFromFile} from "../messages";

const baseUrl = "baseUrl/"
const context: AppContextValue = {baseUrl, environment: internalDevSandbox}
const doseToTextUrl = `${baseUrl}dose-to-text`
const exampleBundle = JSON.stringify(readBundleFromFile("prescriptionOrder.json"))
const mockResponse = [
  {
    "identifier": [
      {
        "system": "https://fhir.nhs.uk/Id/prescription-order-item-number",
        "value": "a54219b8-f741-4c47-b662-e4f8dfa49ab6"
      }
    ],
    "dosageInstructionText": "Inject 5 times a day - Subcutaneous route - for 10 days"
  }
]

beforeEach(() => moxios.install(axiosInstance))

afterEach(() => moxios.uninstall(axiosInstance))

test("Displays dose to text form on render", async () => {
  const container = await renderPage()
  expect(screen.getByText("Dose to Text")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays dose to text result", async () => {
  moxios.stubRequest(doseToTextUrl, {
    status: 200,
    response: {
      success: true,
      results: mockResponse,
      request: "Request (FHIR)",
      response: "Response (FHIR)"
    }
  })

  const container = await renderPage()
  const textArea = container.querySelector("[name='doseToTextRequest']")
  fireEvent.change(textArea, {target: {value: exampleBundle}})
  userEvent.click(screen.getByText("Convert"))
  await waitFor(() => screen.getByText("Dose to Text Result"))
  expect(screen.getByText(JSON.stringify("Request (FHIR)"))).toBeTruthy()
  expect(screen.getByText(JSON.stringify("Response (FHIR)"))).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

async function renderPage() {
  const {container} = renderWithContext(<DoseToTextPage />, context)
  await waitFor(() => screen.getByText("Dose to Text"))
  return container
}

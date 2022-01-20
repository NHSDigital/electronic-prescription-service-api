import {waitFor} from "@testing-library/react"
import {fireEvent, screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import moxios from "moxios"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import userEvent from "@testing-library/user-event"
import {axiosInstance} from "../../src/requests/axiosInstance"
import ValidatePage from "../../src/pages/validatePage"

const baseUrl = "baseUrl/"
const context: AppContextValue = {baseUrl}

const validateUrl = `${baseUrl}validate`

beforeEach(() => moxios.install(axiosInstance))

afterEach(() => moxios.uninstall(axiosInstance))

test("Displays validate form", async () => {
  const container = await renderPage()

  expect(screen.getByText("Validate a FHIR Resource")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays validate result", async () => {
  moxios.stubRequest(validateUrl, {
    status: 200,
    response: {
      success: true,
      request: "JSON Request",
      response: "JSON Response"
    }
  })

  const container = await renderPage()
  const textArea = container.querySelector("[name='validatePayload']")
  fireEvent.change(textArea, {target: {value: "{}"}})
  userEvent.click(screen.getByText("Validate"))
  await waitFor(() => screen.getByText("Sending validation request."))
  await waitFor(() => screen.getByText(/Validate Result/))
  expect(screen.getByText(JSON.stringify("JSON Request"))).toBeTruthy()
  expect(screen.getByText(JSON.stringify("JSON Response"))).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

async function renderPage() {
  const {container} = renderWithContext(<ValidatePage/>, context)
  await waitFor(() => screen.getByText("Validate a FHIR Resource"))
  return container
}

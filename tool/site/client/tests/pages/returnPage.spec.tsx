import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import moxios from "moxios"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import userEvent from "@testing-library/user-event"
import {axiosInstance} from "../../src/requests/axiosInstance"
import ReturnPage from "../../src/pages/returnPage"
import {internalDev} from "../../src/services/environment"

const baseUrl = "baseUrl/"
const prescriptionId = "7A9089-A83008-56A03J"
const context: AppContextValue = {baseUrl, environment: internalDev}

const returnUrl = `${baseUrl}dispense/return`

beforeEach(() => moxios.install(axiosInstance))

afterEach(() => moxios.uninstall(axiosInstance))

test("Displays return form", async () => {
  const container = await renderPage()

  expect(screen.getByText("Return prescription")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays return result", async () => {
  moxios.stubRequest(returnUrl, {
    status: 200,
    response: {
      prescriptionIds: [],
      success: true,
      request: {req: "JSON Request"},
      request_xml: "XML Request",
      response: {res: "JSON Response"},
      response_xml: "XML Response"
    }
  })

  const container = await renderPage()
  userEvent.click(screen.getByText("Return"))
  await waitFor(() => screen.getByText("Sending return."))
  await waitFor(() => screen.getByText(/Return Result/))
  expect(screen.getByText((/JSON Request/))).toBeTruthy()
  expect(screen.getByText("XML Request")).toBeTruthy()
  expect(screen.getByText((/JSON Response/))).toBeTruthy()
  expect(screen.getByText("XML Response")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

async function renderPage() {
  const {container} = renderWithContext(<ReturnPage prescriptionId={prescriptionId}/>, context)
  await waitFor(() => screen.getByText("Return prescription"))
  return container
}

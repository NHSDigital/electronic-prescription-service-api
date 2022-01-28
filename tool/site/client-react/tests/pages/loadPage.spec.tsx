import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import moxios from "moxios"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import userEvent from "@testing-library/user-event"
import {axiosInstance} from "../../src/requests/axiosInstance"
import {internalDev} from "../../src/services/environment"
import LoadPage from "../../src/pages/loadPage"

const baseUrl = "baseUrl/"
const context: AppContextValue = {baseUrl, environment: internalDev}

beforeEach(() => moxios.install(axiosInstance))

afterEach(() => moxios.uninstall(axiosInstance))

test("Displays load page", async () => {
  const container = await renderPage()

  expect(screen.getByText("Load prescription(s)")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays custom fields when custom button is pressed", async () => {
  const container = await renderPage()
  userEvent.click(screen.getByText("Custom"))
  await waitFor(() => screen.getByText("Paste a FHIR prescription"))
  expect(screen.getByText("Paste a FHIR prescription")).toBeTruthy()
  expect(screen.getByText("Upload Test Pack")).toBeTruthy()
  expect(screen.getByText("Upload FHIR prescription files")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

async function renderPage() {
  const {container} = renderWithContext(<LoadPage/>, context)
  await waitFor(() => screen.getByText("Load prescription(s)"))
  return container
}

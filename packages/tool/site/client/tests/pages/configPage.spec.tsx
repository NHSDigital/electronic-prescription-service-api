import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import MockAdapter from "axios-mock-adapter"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import userEvent from "@testing-library/user-event"
import {axiosInstance} from "../../src/requests/axiosInstance"
import {int, internalDev} from "../../src/services/environment"
import ConfigPage from "../../src/pages/configPage"
import {MemoryRouter} from "react-router-dom"

const baseUrl = "baseUrl/"

const configUrl = `${baseUrl}config`

const mock = new MockAdapter(axiosInstance)

beforeEach(() => mock.reset())
afterEach(() => mock.reset())

test("Displays config form correctly in internal dev", async () => {
  const context: AppContextValue = {baseUrl, environment: internalDev}
  const container = await renderPage(context)

  expect(screen.getByText("Config")).toBeTruthy()
  expect(screen.getByText("EPS PR Number")).toBeTruthy()
  expect(screen.getByText("Use Proxygen deployed APIs")).toBeTruthy()
  expect(screen.getByText("Use Signing Mock")).toBeTruthy()
  expect(screen.getByText("Signing PR Number")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays config form correctly in int", async () => {
  const context: AppContextValue = {baseUrl, environment: int}
  const container = await renderPage(context)

  expect(screen.getByText("Config")).toBeTruthy()
  expect(screen.queryByText("EPS PR Number")).toBeNull()
  expect(screen.getByText("Use Proxygen deployed APIs")).toBeTruthy()
  expect(screen.queryByText("Use Signing Mock")).toBeNull()
  expect(screen.queryByText("Signing PR Number")).toBeNull()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays config update result", async () => {
  const context: AppContextValue = {baseUrl, environment: internalDev}
  mock.onAny(configUrl).reply(200, {
    success: true
  })

  const container = await renderPage(context)
  userEvent.click(screen.getByText("Save"))
  await waitFor(() => screen.getByText(/Config Saved/))
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

async function renderPage(context) {
  const {container} = renderWithContext(<MemoryRouter><ConfigPage/></MemoryRouter>, context)
  await waitFor(() => screen.getByText("Config"))
  return container
}

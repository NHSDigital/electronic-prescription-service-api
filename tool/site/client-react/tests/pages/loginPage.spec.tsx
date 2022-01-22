import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import moxios from "moxios"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import {axiosInstance} from "../../src/requests/axiosInstance"
import {Environment, int, internalDev} from "../../src/services/environment"
import LoginPage from "../../src/pages/loginPage"
import userEvent from "@testing-library/user-event"
import {redirect} from "../../src/browser/navigation"

const baseUrl = "baseUrl/"

jest.mock('../../src/browser/navigation', () => ({
  redirect: jest.fn()
}))

beforeEach(() => moxios.install(axiosInstance))

afterEach(() => moxios.uninstall(axiosInstance))

test("Displays user/system options in internal-dev", async () => {
  const container = await renderPage(internalDev)

  expect(screen.getByText("Select access level:")).toBeTruthy()
  expect(screen.getByText("User")).toBeTruthy()
  expect(screen.getByText("System")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test.skip("Redirects to attended simulated auth when selecting user access level in internal-dev", async () => {
  const container = await renderPage(internalDev)
  await waitFor(() => screen.getByText("Login"))
  userEvent.click(screen.getByText("User"))
  expect(redirect).toBeCalledWith("something")
})

test.skip("Redirects to attended cis2 login in integration", async () => {
  const container = await renderPage(int)
  expect(redirect).toBeCalledWith("something")
})

async function renderPage(environment: Environment) {
  const context: AppContextValue = {baseUrl, environment}
  const {container} = renderWithContext(<LoginPage/>, context)
  return container
}

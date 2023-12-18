import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import MockAdapter from "axios-mock-adapter"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import {axiosInstance} from "../../src/requests/axiosInstance"
import {internalDev} from "../../src/services/environment"
import LogoutPage from "../../src/pages/logoutPage"

const baseUrl = "baseUrl/"
const context: AppContextValue = {baseUrl, environment: internalDev}

const mock = new MockAdapter(axiosInstance)

beforeEach(() => mock.reset())
afterEach(() => mock.reset())

test("Displays logout page", async () => {
  const container = await renderPage()

  expect(screen.getByText("You have been logged out")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

async function renderPage() {
  const {container} = renderWithContext(<LogoutPage/>, context)
  await waitFor(() => screen.getByText("You have been logged out"))
  return container
}

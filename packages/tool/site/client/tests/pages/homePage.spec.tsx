import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import MockAdapter from "axios-mock-adapter"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import {axiosInstance} from "../../src/requests/axiosInstance"
import HomePage from "../../src/pages/homePage"
import {internalDev} from "../../src/services/environment"

const baseUrl = "baseUrl/"
const context: AppContextValue = {baseUrl, environment: internalDev}

const mock = new MockAdapter(axiosInstance)

beforeEach(() => mock.reset())
afterEach(() => mock.reset())

test("Displays home page", async () => {
  const container = await renderPage()

  expect(screen.getByText("I would like to...")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

async function renderPage() {
  const {container} = renderWithContext(<HomePage/>, context)
  await waitFor(() => screen.getByText("I would like to..."))
  return container
}

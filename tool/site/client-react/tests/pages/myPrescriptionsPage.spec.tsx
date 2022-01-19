import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import moxios from "moxios"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import {axiosInstance} from "../../src/requests/axiosInstance"
import MyPrescriptionsPage from "../../src/pages/myPrescriptionsPage"

const baseUrl = "baseUrl/"
const context: AppContextValue = {baseUrl}

const prescriptionsUrl = `${baseUrl}prescriptions`

beforeEach(() => moxios.install(axiosInstance))

afterEach(() => moxios.uninstall(axiosInstance))

test("Displays my prescriptions page", async () => {
  moxios.stubRequest(prescriptionsUrl, {
    status: 200,
    response: {
      any: false,
      sentPrescriptions: [],
      releasedPrescriptions: []
    }
  })

  const container = await renderPage()

  expect(screen.getByText("My Prescriptions")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays sent prescriptions from session", async () => {
  moxios.stubRequest(prescriptionsUrl, {
    status: 200,
    response: {
      any: true,
      sentPrescriptions: [{id: "FC6D78-A83008-EDF7BI"}],
      releasedPrescriptions: []
    }
  })

  const container = await renderPage()
  await waitFor(() => screen.getByText(/Sent Prescriptions/))
  expect(screen.getByText("FC6D78-A83008-EDF7BI")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays released prescriptions from session", async () => {
  moxios.stubRequest(prescriptionsUrl, {
    status: 200,
    response: {
      any: true,
      sentPrescriptions: [],
      releasedPrescriptions: [{id: "FC6D78-A83008-EDF7BF"}]
    }
  })

  const container = await renderPage()
  await waitFor(() => screen.getByText(/Released Prescriptions/))
  expect(screen.getByText("FC6D78-A83008-EDF7BF")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

async function renderPage() {
  const {container} = renderWithContext(<MyPrescriptionsPage/>, context)
  await waitFor(() => screen.getByText("My Prescriptions"))
  return container
}

import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import moxios from "moxios"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import {axiosInstance} from "../../src/requests/axiosInstance"
import MyPrescriptionsPage from "../../src/pages/myPrescriptionsPage"
import {internalDev} from "../../src/services/environment"

const baseUrl = "baseUrl/"
const context: AppContextValue = {baseUrl, environment: internalDev}

const prescriptionsUrl = `${baseUrl}prescriptions`

beforeEach(() => moxios.install(axiosInstance))

afterEach(() => moxios.uninstall(axiosInstance))

test("Displays my prescriptions page", async () => {
  moxios.stubRequest(prescriptionsUrl, {
    status: 200,
    response: {
      sentPrescriptions: [],
      releasedPrescriptions: [],
      dispensedPrescriptions: [],
      claimedPrescriptions: []
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
      sentPrescriptions: ["FC6D78-A83008-EDF7BI"],
      releasedPrescriptions: [],
      dispensedPrescriptions: [],
      claimedPrescriptions: []
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
      sentPrescriptions: [],
      releasedPrescriptions: ["FC6D78-A83008-EDF7BF"],
      dispensedPrescriptions: [],
      claimedPrescriptions: []
    }
  })

  const container = await renderPage()
  await waitFor(() => screen.getByText(/Released Prescriptions/))
  expect(screen.getByText("FC6D78-A83008-EDF7BF")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays dispensed prescriptions from session", async () => {
  moxios.stubRequest(prescriptionsUrl, {
    status: 200,
    response: {
      sentPrescriptions: [],
      releasedPrescriptions: [],
      dispensedPrescriptions: ["FC6D78-A83008-EDF7BF"],
      claimedPrescriptions: []
    }
  })

  const container = await renderPage()
  await waitFor(() => screen.getByText(/Dispensed Prescriptions/))
  expect(screen.getByText("FC6D78-A83008-EDF7BF")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays claimed prescriptions from session", async () => {
  moxios.stubRequest(prescriptionsUrl, {
    status: 200,
    response: {
      sentPrescriptions: [],
      releasedPrescriptions: [],
      dispensedPrescriptions: [],
      claimedPrescriptions: ["FC6D78-A83008-EDF7BF"]
    }
  })

  const container = await renderPage()
  await waitFor(() => screen.getByText(/Claimed Prescriptions/))
  expect(screen.getByText("FC6D78-A83008-EDF7BF")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays sent, released, dispensed and claimed prescriptions from session", async () => {
  moxios.stubRequest(prescriptionsUrl, {
    status: 200,
    response: {
      sentPrescriptions: ["FC6D78-A83008-EDF7BA"],
      releasedPrescriptions: ["FC6D78-A83008-EDF7BB"],
      dispensedPrescriptions: ["FC6D78-A83008-EDF7BC"],
      claimedPrescriptions: ["FC6D78-A83008-EDF7BD"]
    }
  })

  const container = await renderPage()
  await waitFor(() => screen.getByText(/Sent Prescriptions/))
  await waitFor(() => screen.getByText(/Released Prescriptions/))
  await waitFor(() => screen.getByText(/Dispensed Prescriptions/))
  await waitFor(() => screen.getByText(/Claimed Prescriptions/))
  expect(screen.getByText("FC6D78-A83008-EDF7BA")).toBeTruthy()
  expect(screen.getByText("FC6D78-A83008-EDF7BB")).toBeTruthy()
  expect(screen.getByText("FC6D78-A83008-EDF7BC")).toBeTruthy()
  expect(screen.getByText("FC6D78-A83008-EDF7BD")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

async function renderPage() {
  const {container} = renderWithContext(<MyPrescriptionsPage/>, context)
  await waitFor(() => screen.getByText("My Prescriptions"))
  return container
}

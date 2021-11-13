import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import moxios from "moxios"
import userEvent from "@testing-library/user-event"
import {readMessage} from "../messages/messages"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import DispensePage from "../../src/pages/dispensePage"

const baseUrl = "baseUrl/"
const prescriptionId = "7A9089-A83008-56A03J"
const context: AppContextValue = {baseUrl}

const prescriptionOrderUrl = `${baseUrl}prescription/${prescriptionId}`
const dispenseNotificationUrl = `${baseUrl}dispenseNotifications/${prescriptionId}`
const dispenseUrl = `${baseUrl}dispense/dispense`

const prescriptionOrder = readMessage("prescriptionOrder.json")
const dispenseNotification = readMessage("dispenseNotification.json")

beforeEach(() => moxios.install())

afterEach(() => moxios.uninstall())

test("Displays loading text while prescription data is being requested", async () => {
  const {container} = renderWithContext(<DispensePage prescriptionId={prescriptionId}/>, context)
  await waitFor(() => screen.getByText("Retrieving prescription details."))

  expect(screen.getByText("Loading...")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays dispense form if prescription details are retrieved successfully (no previous dispense notification)", async () => {
  moxios.stubRequest(prescriptionOrderUrl, {
    status: 200,
    response: prescriptionOrder
  })
  moxios.stubRequest(dispenseNotificationUrl, {
    status: 200,
    response: []
  })

  const container = await renderPage()

  expect(screen.getByText("Dispense")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays dispense form if prescription details are retrieved successfully (previous dispense notification)", async () => {
  moxios.stubRequest(prescriptionOrderUrl, {
    status: 200,
    response: prescriptionOrder
  })
  moxios.stubRequest(dispenseNotificationUrl, {
    status: 200,
    response: [dispenseNotification]
  })

  const container = await renderPage()

  expect(screen.getByText("Dispense")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays an error if prescription-order not found", async () => {
  moxios.stubRequest(prescriptionOrderUrl, {
    status: 200,
    response: null
  })

  const {container} = renderWithContext(<DispensePage prescriptionId={prescriptionId}/>, context)
  await waitFor(() => screen.getByText("Error"))

  expect(screen.getByText("Prescription order not found. Is the ID correct?")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays an error on invalid response", async () => {
  moxios.stubRequest(prescriptionOrderUrl, {
    status: 500,
    response: {}
  })

  const {container} = renderWithContext(<DispensePage prescriptionId={prescriptionId}/>, context)
  await waitFor(() => screen.getByText("Error"))

  expect(screen.getByText("Request failed with status code 500")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays loading text while dispense notification is being submitted", async () => {
  moxios.stubRequest(prescriptionOrderUrl, {
    status: 200,
    response: prescriptionOrder
  })
  moxios.stubRequest(dispenseNotificationUrl, {
    status: 200,
    response: [dispenseNotification]
  })

  const container = await renderPage()
  userEvent.click(screen.getByText("Dispense"))
  await waitFor(() => screen.getByText("Loading..."))

  expect(screen.getByText("Sending dispense notification.")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays dispense result", async () => {
  moxios.stubRequest(prescriptionOrderUrl, {
    status: 200,
    response: prescriptionOrder
  })
  moxios.stubRequest(dispenseNotificationUrl, {
    status: 200,
    response: [dispenseNotification]
  })
  moxios.stubRequest(dispenseUrl, {
    status: 200,
    response: {
      success: true,
      request: "JSON Request",
      request_xml: "XML Request",
      response: "JSON Response",
      response_xml: "XML Response"
    }
  })

  const container = await renderPage()
  userEvent.click(screen.getByText("Dispense"))
  await waitFor(() => screen.getByText(/Dispense Result/))

  expect(screen.getByText(JSON.stringify("JSON Request"))).toBeTruthy()
  expect(screen.getByText("XML Request")).toBeTruthy()
  expect(screen.getByText(JSON.stringify("JSON Response"))).toBeTruthy()
  expect(screen.getByText("XML Response")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

async function renderPage() {
  const {container} = renderWithContext(<DispensePage prescriptionId={prescriptionId}/>, context)
  await waitFor(() => screen.getByText("Dispense Medication"))
  return container
}

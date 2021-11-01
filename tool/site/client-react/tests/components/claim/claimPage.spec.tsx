import {render, waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import moxios from "moxios"
import ClaimPage from "../../../src/components/claim/claimPage"
import userEvent from "@testing-library/user-event"
import {readMessage} from "./messages/messages"

const baseUrl = "baseUrl/"
const prescriptionId = "7A9089-A83008-56A03J"

const prescriptionOrderUrl = `${baseUrl}prescription/${prescriptionId}`
const dispenseNotificationUrl = `${baseUrl}dispense/history?prescription_id=${prescriptionId}`
const claimUrl = `${baseUrl}dispense/claim`

const prescriptionOrder = readMessage("prescriptionOrder.json")
const dispenseNotification = readMessage("dispenseNotification.json")

beforeEach(() => moxios.install())

afterEach(() => moxios.uninstall())

test("Displays loading text while prescription data is being requested", async () => {
  const {container} = render(<ClaimPage baseUrl={baseUrl} prescriptionId={prescriptionId}/>)
  await waitFor(() => screen.getByText("Retrieving prescription details."))

  expect(screen.getByText("Loading...")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays claim form if prescription details are retrieved successfully", async () => {
  moxios.stubRequest(prescriptionOrderUrl, {
    status: 200,
    response: prescriptionOrder
  })
  moxios.stubRequest(dispenseNotificationUrl, {
    status: 200,
    response: {
      dispense_notifications: [dispenseNotification]
    }
  })

  const {container} = render(<ClaimPage baseUrl={baseUrl} prescriptionId={prescriptionId}/>)
  await waitFor(() => screen.getByText("Claim for Dispensed Medication"))

  expect(screen.getByText("Claim")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays an error if prescription-order not found", async () => {
  moxios.stubRequest(prescriptionOrderUrl, {
    status: 200,
    response: null
  })

  const {container} = render(<ClaimPage baseUrl={baseUrl} prescriptionId={prescriptionId}/>)
  await waitFor(() => screen.getByText("Error"))

  expect(screen.getByText("Prescription order not found. Is the ID correct?")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays an error if dispense-notification not found", async () => {
  moxios.stubRequest(prescriptionOrderUrl, {
    status: 200,
    response: prescriptionOrder
  })
  moxios.stubRequest(dispenseNotificationUrl, {
    status: 200,
    response: {
      dispense_notifications: []
    }
  })

  const {container} = render(<ClaimPage baseUrl={baseUrl} prescriptionId={prescriptionId}/>)
  await waitFor(() => screen.getByText("Error"))

  expect(screen.getByText("Dispense notification not found. Has this prescription been dispensed?")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays an error on invalid response", async () => {
  moxios.stubRequest(prescriptionOrderUrl, {
    status: 200,
    response: {}
  })
  moxios.stubRequest(dispenseNotificationUrl, {
    status: 200,
    response: {
      dispense_notifications: [{}]
    }
  })

  const {container} = render(<ClaimPage baseUrl={baseUrl} prescriptionId={prescriptionId}/>)
  await waitFor(() => screen.getByText("Error"))

  expect(screen.getByText("Failed to retrieve prescription details.")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays loading text while claim is being submitted", async () => {
  moxios.stubRequest(prescriptionOrderUrl, {
    status: 200,
    response: prescriptionOrder
  })
  moxios.stubRequest(dispenseNotificationUrl, {
    status: 200,
    response: {
      dispense_notifications: [dispenseNotification]
    }
  })

  const {container} = render(<ClaimPage baseUrl={baseUrl} prescriptionId={prescriptionId}/>)
  await waitFor(() => screen.getByText("Claim for Dispensed Medication"))
  userEvent.click(screen.getByText("Claim"))
  await waitFor(() => screen.getByText("Loading..."))

  expect(screen.getByText("Sending claim.")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays claim result", async () => {
  moxios.stubRequest(prescriptionOrderUrl, {
    status: 200,
    response: prescriptionOrder
  })
  moxios.stubRequest(dispenseNotificationUrl, {
    status: 200,
    response: {
      dispense_notifications: [dispenseNotification]
    }
  })
  moxios.stubRequest(claimUrl, {
    status: 200,
    response: "Mock result"
  })

  const {container} = render(<ClaimPage baseUrl={baseUrl} prescriptionId={prescriptionId}/>)
  await waitFor(() => screen.getByText("Claim for Dispensed Medication"))
  userEvent.click(screen.getByText("Claim"))
  await waitFor(() => screen.getByText("Result"))

  expect(screen.getByText(JSON.stringify("Mock result"))).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

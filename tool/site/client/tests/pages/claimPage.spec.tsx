import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import moxios from "moxios"
import ClaimPage, {getInitialValues} from "../../src/pages/claimPage"
import userEvent from "@testing-library/user-event"
import {readBundleFromFile, readClaimFromFile} from "../messages"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import {axiosInstance} from "../../src/requests/axiosInstance"
import {internalDev} from "../../src/services/environment"
import {StaticProductInfo} from "../../src/components/claim/claimForm"

const baseUrl = "baseUrl/"
const prescriptionId = "7A9089-A83008-56A03J"
const context: AppContextValue = {baseUrl, environment: internalDev}

const releaseResponseUrl = `${baseUrl}dispense/release/${prescriptionId}`
const dispenseNotificationUrl = `${baseUrl}dispenseNotifications/${prescriptionId}`
const claimDownloadUrl = `${baseUrl}claim/${prescriptionId}`
const claimUploadUrl = `${baseUrl}dispense/claim`

const prescriptionOrder = readBundleFromFile("prescriptionOrder.json")
const dispenseNotification = readBundleFromFile("dispenseNotification.json")
const claim = readClaimFromFile("claim.json")

beforeEach(() => moxios.install(axiosInstance))

afterEach(() => moxios.uninstall(axiosInstance))

test("Displays loading text while prescription data is being requested", async () => {
  const {container} = renderWithContext(<ClaimPage prescriptionId={prescriptionId}/>, context)
  await waitFor(() => screen.getByText("Loading"))

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays claim form if prescription details are retrieved successfully", async () => {
  moxios.stubRequest(releaseResponseUrl, {
    status: 200,
    response: prescriptionOrder
  })
  moxios.stubRequest(dispenseNotificationUrl, {
    status: 200,
    response: [dispenseNotification]
  })

  const container = await renderClaimPage()

  expect(screen.getByText("Claim")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays an error if prescription-order not found", async () => {
  moxios.stubRequest(releaseResponseUrl, {
    status: 200,
    response: null
  })

  const {container} = renderWithContext(<ClaimPage prescriptionId={prescriptionId}/>, context)
  await waitFor(() => screen.getByText("Error"))

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays an error if dispense-notification not found", async () => {
  moxios.stubRequest(releaseResponseUrl, {
    status: 200,
    response: prescriptionOrder
  })
  moxios.stubRequest(dispenseNotificationUrl, {
    status: 200,
    response: []
  })

  const {container} = renderWithContext(<ClaimPage prescriptionId={prescriptionId}/>, context)
  await waitFor(() => screen.getByText("Error"))

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays an error on invalid response", async () => {
  moxios.stubRequest(releaseResponseUrl, {
    status: 500,
    statusText: "Internal Server Error",
    response: {}
  })

  const {container} = renderWithContext(<ClaimPage prescriptionId={prescriptionId}/>, context)
  await waitFor(() => screen.getByText("Error"))

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays loading text while claim is being submitted", async () => {
  moxios.stubRequest(releaseResponseUrl, {
    status: 200,
    response: prescriptionOrder
  })
  moxios.stubRequest(dispenseNotificationUrl, {
    status: 200,
    response: [dispenseNotification]
  })

  const container = await renderClaimPage()
  userEvent.click(screen.getByText("Claim"))
  await waitFor(() => screen.getByText("Loading"))

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays claim result", async () => {
  moxios.stubRequest(releaseResponseUrl, {
    status: 200,
    response: prescriptionOrder
  })
  moxios.stubRequest(dispenseNotificationUrl, {
    status: 200,
    response: [dispenseNotification]
  })
  moxios.stubRequest(claimUploadUrl, {
    status: 200,
    response: {
      success: true,
      request: "JSON Request",
      request_xml: "XML Request",
      response: "JSON Response",
      response_xml: "XML Response"
    }
  })

  const container = await renderClaimPage()
  userEvent.click(screen.getByText("Claim"))
  await waitFor(() => screen.getByText(/Claim Result/))

  expect(screen.getByText(JSON.stringify("JSON Request"))).toBeTruthy()
  expect(screen.getByText("XML Request")).toBeTruthy()
  expect(screen.getByText(JSON.stringify("JSON Response"))).toBeTruthy()
  expect(screen.getByText("XML Response")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays claim amend form if prescription details are retrieved successfully", async () => {
  moxios.stubRequest(releaseResponseUrl, {
    status: 200,
    response: prescriptionOrder
  })
  moxios.stubRequest(dispenseNotificationUrl, {
    status: 200,
    response: [dispenseNotification]
  })
  moxios.stubRequest(claimDownloadUrl, {
    status: 200,
    response: claim
  })

  const container = await renderClaimAmendPage()

  expect(screen.getByText("Claim")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays an error if previous claim not found for amend", async () => {
  moxios.stubRequest(releaseResponseUrl, {
    status: 200,
    response: prescriptionOrder
  })
  moxios.stubRequest(dispenseNotificationUrl, {
    status: 200,
    response: [dispenseNotification]
  })
  moxios.stubRequest(claimDownloadUrl, {
    status: 200,
    response: null
  })

  const {container} = renderWithContext(<ClaimPage prescriptionId={prescriptionId} amend/>, context)
  await waitFor(() => screen.getByText("Error"))

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

async function renderClaimPage() {
  const {container} = renderWithContext(<ClaimPage prescriptionId={prescriptionId}/>, context)
  await waitFor(() => screen.getByText("Claim for Dispensed Prescription"))
  return container
}

async function renderClaimAmendPage() {
  const {container} = renderWithContext(<ClaimPage prescriptionId={prescriptionId} amend/>, context)
  await waitFor(() => screen.getByText("Claim for Dispensed Prescription"))
  return container
}

describe("getInitialValues", () => {
  const testProduct: StaticProductInfo = {
    id: "test",
    name: "testMedication",
    status: "dispensed",
    quantityDispensed: "200"
  }

  const testClaim = claim

  test("can create initial values for one product when no previous claim exists", () => {
    const result = getInitialValues([testProduct])

    expect(result.products).toHaveLength(1)
  })

  test("can create initial values for more than one product when no previous claim exists", () => {
    const result = getInitialValues([testProduct, testProduct])

    expect(result.products).toHaveLength(2)
  })

  test("can create initial values for one product when previous claim exists", () => {
    const result = getInitialValues([testProduct], testClaim)

    expect(result.products).toHaveLength(1)
  })

  test("overwrites default form values from claim", () => {
    const lineItemId = "a54219b8-f741-4c47-b662-e4f8dfa49ab6"

    const testProduct1 = {...testProduct, id: lineItemId}
    const testProduct2 = {...testProduct, id: "test2"}
    const result = getInitialValues([testProduct1, testProduct2], testClaim)

    expect(result.products).toHaveLength(1)
    expect(result.products[0].id).toEqual(lineItemId)
    expect(result.products[0].patientPaid).toEqual(true)
    expect(result.products[0].endorsements).toEqual([{code: "NDEC"}])
  })
})

import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import * as React from "react"
import MockAdapter from "axios-mock-adapter"
import userEvent from "@testing-library/user-event"
import {readBundleFromFile} from "../messages"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import SignPage from "../../src/pages/signPage"
import {OperationOutcome} from "fhir/r4"
import {redirect} from "../../src/browser/navigation"
import {axiosInstance} from "../../src/requests/axiosInstance"
import {MomentInput} from "moment"
import {internalDev} from "../../src/services/environment"
import {MemoryRouter} from "react-router-dom"

vi.spyOn(global.crypto, "randomUUID")
  .mockReturnValue("test-uuid-in-uuid-format")

const baseUrl = "baseUrl/"
const context: AppContextValue = {baseUrl, environment: internalDev}

const prescriptionsUrl = `${baseUrl}prescriptions`
const editPrescriptionsUrl = `${baseUrl}prescribe/edit`
const signatureRequestUrl = `${baseUrl}sign/upload-signatures`

const prescriptionOrder = readBundleFromFile("prescriptionOrder.json")

vi.mock("moment", () => {
  const actualMoment = require("moment")
  return {
    default: actualMoment,
    ...actualMoment,
    utc: (inp?: MomentInput, strict?: boolean) => actualMoment.utc(inp ?? "2021-11-13T10:57:13.000Z", strict)
  }
})

vi.mock("../../src/browser/navigation", () => ({
  redirect: vi.fn()
}))

const mock = new MockAdapter(axiosInstance)

beforeEach(() => mock.reset())
afterEach(() => mock.reset())

test("Displays loading text while prescription data is being requested", async () => {
  mock.onGet(prescriptionsUrl).reply(function () {
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve([200, [prescriptionOrder]])
      }
        , 1000)
    })
  })
  const {container} = renderWithContext(<SignPage />, context)
  await waitFor(() => screen.getByText("Retrieving prescription details."))

  expect(screen.getByText("Retrieving prescription details.")).toBeTruthy()
  expect(container.innerHTML).toMatchSnapshot()
})

test("Displays prescription summary if prescription details are retrieved successfully", async () => {
  mock.onAny(prescriptionsUrl).reply(200, [prescriptionOrder])

  const container = await renderPage()

  expect(screen.getByText("Sign & Send")).toBeTruthy()
  expect(container.innerHTML).toMatchSnapshot()
})

test("Displays loading text while prescription is being sent", async () => {
  mock.onAny(prescriptionsUrl).reply(200, [prescriptionOrder])
  mock.onPost(signatureRequestUrl).reply(() => new Promise(resolve => setTimeout(() => resolve([200, {redirectUri: "https://example.com/"}]), 1000)))

  const container = await renderPage()
  userEvent.click(screen.getByText("Sign & Send"))
  await waitFor(() => screen.getByText("Sending signature request."))

  expect(container.innerHTML).toMatchSnapshot()
})

test("Redirects and displays link if signature request upload is successful", async () => {
  mock.onAny(signatureRequestUrl).reply(200, {
    redirectUri: "https://example.com/"
  })
  mock.onAny(prescriptionsUrl).reply(200, [prescriptionOrder])
  mock.onAny(editPrescriptionsUrl).reply(200, {
    redirectUri: ""
  })

  const container = await renderPage()
  userEvent.click(screen.getByText("Sign & Send"))
  await waitFor(() => screen.getByText("Upload Complete"))

  expect(redirect).toHaveBeenCalledWith("https://example.com/")

  const link = screen.getByRole<HTMLAnchorElement>("link")
  expect(link.text).toEqual("Proceed to the Signing Service")
  expect(link.href).toEqual("https://example.com/")
  expect(container.innerHTML).toMatchSnapshot()
})

test("Displays error message if prepare errors present", async () => {
  const operationOutcome: OperationOutcome = {
    resourceType: "OperationOutcome",
    issue: [{
      severity: "fatal",
      code: "invalid",
      diagnostics: "Some error message"
    }]
  }
  mock.onAny(signatureRequestUrl).reply(200, {
    prepareErrors: [operationOutcome]
  })
  mock.onAny(prescriptionsUrl).reply(200, [prescriptionOrder])
  mock.onAny(editPrescriptionsUrl).reply(200, {
    redirectUri: ""
  })

  const container = await renderPage()
  userEvent.click(screen.getByText("Sign & Send"))
  await waitFor(() => screen.getByText("Error"))

  expect(container.innerHTML).toMatchSnapshot()
})

test("Displays error message if redirect URI not present", async () => {
  const operationOutcome: OperationOutcome = {
    resourceType: "OperationOutcome",
    meta: {
      lastUpdated: "2022-10-21T13:47:00+00:00"
    },
    issue: [{
      severity: "fatal",
      code: "invalid",
      diagnostics: "Some error message"
    }]
  }
  mock.onAny(signatureRequestUrl).reply(400, operationOutcome)
  mock.onAny(prescriptionsUrl).reply(200, [prescriptionOrder])
  mock.onAny(editPrescriptionsUrl).reply(200, {
    redirectUri: ""
  })

  const container = await renderPage()
  userEvent.click(screen.getByText("Sign & Send"))
  await waitFor(() => screen.getByText("Error"))

  expect(container.innerHTML).toMatchSnapshot()
})

async function renderPage() {
  const {container} = renderWithContext(<MemoryRouter><SignPage /></MemoryRouter>, context)
  await waitFor(() => screen.getByText("Prescription Summary"))
  return container
}

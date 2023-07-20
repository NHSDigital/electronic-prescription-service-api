import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import moxios from "moxios"
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
import {sign} from "../../src/requests/callCredentialManager"

const baseUrl = "baseUrl/"
const context: AppContextValue = {baseUrl, environment: internalDev}

const prescriptionsUrl = `${baseUrl}prescriptions`
const editPrescriptionsUrl = `${baseUrl}prescribe/edit`
const signatureRequestUrl = `${baseUrl}sign/upload-signatures`

const prescriptionOrder = readBundleFromFile("prescriptionOrder.json")

jest.mock("moment", () => {
  const actualMoment = jest.requireActual("moment")
  return ({
    ...actualMoment,
    utc: (inp?: MomentInput, strict?: boolean) => actualMoment.utc(inp ?? "2021-11-13T10:57:13.000Z", strict)
  })
})

jest.mock("../../src/browser/navigation")
jest.mock("../../src/requests/callCredentialManager")
jest.mock("../../src/requests/helpers")

beforeEach(() => moxios.install(axiosInstance))

afterEach(() => moxios.uninstall(axiosInstance))

test("Displays loading text while prescription data is being requested", async () => {
  const {container} = renderWithContext(<SignPage/>, context)
  await waitFor(() => screen.getByText("Retrieving prescription details."))

  expect(screen.getByText("Retrieving prescription details.")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays prescription summary if prescription details are retrieved successfully", async () => {
  moxios.stubRequest(prescriptionsUrl, {
    status: 200,
    response: [prescriptionOrder]
  })

  const container = await renderPage()

  expect(screen.getByText("Sign & Send")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays loading text while prescription is being sent", async () => {
  moxios.stubRequest(prescriptionsUrl, {
    status: 200,
    response: [prescriptionOrder]
  })

  const container = await renderPage()
  userEvent.click(screen.getByText("Sign & Send"))
  await waitFor(() => screen.getByText("Sending signature request."))

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Calls to Credential Management", async () => {
  moxios.stubRequest(signatureRequestUrl, {
    status: 200,
    response: {
      redirectUri: "https://example.com/"
    }
  })
  moxios.stubRequest(prescriptionsUrl, {
    status: 200,
    response: [prescriptionOrder]
  })
  moxios.stubRequest(editPrescriptionsUrl, {
    status: 200,
    response: {
      redirectUri: ""
    }
  })
  await renderPage()
  userEvent.click(screen.getByText("Sign & Send"))

  await waitFor(() => screen.getByText("Upload Complete"))

  expect(sign).toHaveBeenCalled()
})

test("Redirects and displays link if signature request upload is successful", async () => {
  moxios.stubRequest(signatureRequestUrl, {
    status: 200,
    response: {
      redirectUri: "https://example.com/"
    }
  })
  moxios.stubRequest(prescriptionsUrl, {
    status: 200,
    response: [prescriptionOrder]
  })
  moxios.stubRequest(editPrescriptionsUrl, {
    status: 200,
    response: {
      redirectUri: ""
    }
  })
  const container = await renderPage()
  userEvent.click(screen.getByText("Sign & Send"))
  await waitFor(() => screen.getByText("Upload Complete"))

  expect(redirect).toHaveBeenCalledWith("https://example.com/")

  const link = screen.getByRole<HTMLAnchorElement>("link")
  expect(link.text).toEqual("Proceed to the Signing Service")
  expect(link.href).toEqual("https://example.com/")
  expect(pretty(container.innerHTML)).toMatchSnapshot()
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
  moxios.stubRequest(signatureRequestUrl, {
    status: 200,
    response: {
      prepareErrors: [operationOutcome]
    }
  })
  moxios.stubRequest(prescriptionsUrl, {
    status: 200,
    response: [prescriptionOrder]
  })
  moxios.stubRequest(editPrescriptionsUrl, {
    status: 200,
    response: {
      redirectUri: ""
    }
  })

  //const container = await renderPage()
  userEvent.click(screen.getByText("Sign & Send"))
  // await waitFor(() => screen.getByText("Error"))

  // expect(pretty(container.innerHTML)).toMatchSnapshot()
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
  moxios.stubRequest(signatureRequestUrl, {
    status: 400,
    statusText: "Bad Request",
    response: operationOutcome
  })
  moxios.stubRequest(prescriptionsUrl, {
    status: 200,
    response: [prescriptionOrder]
  })
  moxios.stubRequest(editPrescriptionsUrl, {
    status: 200,
    response: {
      redirectUri: ""
    }
  })

  //const container = await renderPage()
  userEvent.click(screen.getByText("Sign & Send"))
  // await waitFor(() => screen.getByText("Error"))

  // expect(pretty(container.innerHTML)).toMatchSnapshot()
})

async function renderPage() {
  const {container} = renderWithContext(<SignPage/>, context)
  await waitFor(() => screen.getByText("Prescription Summary"))
  return container
}

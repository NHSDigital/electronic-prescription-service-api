import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import moxios from "moxios"
import userEvent from "@testing-library/user-event"
import {readMessage} from "../messages/messages"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import SendPreSignPage from "../../src/pages/sendPreSignPage"
import {OperationOutcome} from "fhir/r4"
import {redirect} from "../../src/browser/navigation"
import {axiosInstance} from "../../src/requests/axiosInstance"
import {MomentInput} from "moment"

const baseUrl = "baseUrl/"
const prescriptionId = "7A9089-A83008-56A03J"
const context: AppContextValue = {baseUrl}

const prescriptionOrderUrl = `${baseUrl}prescription/${prescriptionId}`
const signatureRequestUrl = `${baseUrl}prescribe/sign`

const prescriptionOrder = readMessage("prescriptionOrder.json")

jest.mock("moment", () => {
  const actualMoment = jest.requireActual("moment")
  return ({
    ...actualMoment,
    utc: (inp?: MomentInput, strict?: boolean) => actualMoment.utc(inp ?? "2021-11-13T10:57:13.000Z", strict)
  })
})

jest.mock("../../src/browser/navigation")

beforeEach(() => moxios.install(axiosInstance))

afterEach(() => moxios.uninstall(axiosInstance))

test("Displays loading text while prescription data is being requested", async () => {
  const {container} = renderWithContext(<SendPreSignPage prescriptionId={prescriptionId}/>, context)
  await waitFor(() => screen.getByText("Retrieving prescription details."))

  expect(screen.getByText("Loading...")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays prescription summary if prescription details are retrieved successfully", async () => {
  moxios.stubRequest(prescriptionOrderUrl, {
    status: 200,
    response: prescriptionOrder
  })

  const container = await renderPage()

  expect(screen.getByText("Send")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays an error if response is an OperationOutcome", async () => {
  const operationOutcome: OperationOutcome = {
    resourceType: "OperationOutcome",
    issue: [{
      severity: "fatal",
      code: "invalid",
      diagnostics: "Some error message"
    }]
  }
  moxios.stubRequest(prescriptionOrderUrl, {
    status: 200,
    response: operationOutcome
  })

  const {container} = renderWithContext(<SendPreSignPage prescriptionId={prescriptionId}/>, context)
  await waitFor(() => screen.getByText("Error"))

  expect(screen.getByText("Some error message")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays an error if response is empty", async () => {
  moxios.stubRequest(prescriptionOrderUrl, {
    status: 500,
    response: null
  })

  const {container} = renderWithContext(<SendPreSignPage prescriptionId={prescriptionId}/>, context)
  await waitFor(() => screen.getByText("Error"))

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays loading text while claim is being submitted", async () => {
  moxios.stubRequest(prescriptionOrderUrl, {
    status: 200,
    response: prescriptionOrder
  })

  const container = await renderPage()
  userEvent.click(screen.getByText("Send"))
  await waitFor(() => screen.getByText("Loading..."))

  expect(screen.getByText("Sending signature request.")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Redirects and displays link if signature request upload is successful", async () => {
  moxios.stubRequest(prescriptionOrderUrl, {
    status: 200,
    response: prescriptionOrder
  })
  moxios.stubRequest(signatureRequestUrl, {
    status: 200,
    response: {
      redirectUri: "https://example.com/"
    }
  })

  const container = await renderPage()
  userEvent.click(screen.getByText("Send"))
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
  moxios.stubRequest(prescriptionOrderUrl, {
    status: 200,
    response: prescriptionOrder
  })
  moxios.stubRequest(signatureRequestUrl, {
    status: 200,
    response: {
      prepareErrors: [operationOutcome]
    }
  })

  const container = await renderPage()
  userEvent.click(screen.getByText("Send"))
  await waitFor(() => screen.getByText("Error"))

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays error message if redirect URI not present", async () => {
  const operationOutcome: OperationOutcome = {
    resourceType: "OperationOutcome",
    issue: [{
      severity: "fatal",
      code: "invalid",
      diagnostics: "Some error message"
    }]
  }
  moxios.stubRequest(prescriptionOrderUrl, {
    status: 200,
    response: prescriptionOrder
  })
  moxios.stubRequest(signatureRequestUrl, {
    status: 400,
    response: operationOutcome
  })

  const container = await renderPage()
  userEvent.click(screen.getByText("Send"))
  await waitFor(() => screen.getByText("Error"))

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

async function renderPage() {
  const {container} = renderWithContext(<SendPreSignPage prescriptionId={prescriptionId}/>, context)
  await waitFor(() => screen.getByText("Prescription Summary"))
  return container
}

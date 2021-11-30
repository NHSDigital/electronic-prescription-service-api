import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import moxios from "moxios"
import userEvent from "@testing-library/user-event"
import {readMessage} from "../messages/messages"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import PrescriptionSearchPage from "../../src/pages/prescriptionSearchPage"
import {Bundle, OperationOutcome} from "fhir/r4"
import {axiosInstance} from "../../src/requests/axiosInstance"
import {MomentInput} from "moment"

const baseUrl = "baseUrl/"
const prescriptionId = "003D4D-A99968-4C5AAJ"
const nhsNumber = "9449304106"
const formattedNhsNumber = "944 930 4106"
const context: AppContextValue = {baseUrl}

const prescriptionSearchByIdUrl = `${baseUrl}tracker?focus:identifier=${prescriptionId}`
const prescriptionSearchByNhsNumberUrl = `${baseUrl}tracker?patient:identifier=${nhsNumber}`

const summarySearchResult = readMessage("summarySearchResult.json")
const detailSearchResult = readMessage("detailSearchResult.json")

jest.mock("moment", () => {
  const actualMoment = jest.requireActual("moment")
  return ({
    ...actualMoment,
    utc: (inp?: MomentInput, strict?: boolean) => actualMoment.utc(inp ?? "2021-11-13T10:57:13.000Z", strict)
  })
})

beforeEach(() => moxios.install(axiosInstance))

afterEach(() => moxios.uninstall(axiosInstance))

test("Displays search form", async () => {
  const container = await renderPage()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Form values are populated from query string", async () => {
  const {container} = renderWithContext(<PrescriptionSearchPage prescriptionId={prescriptionId}/>, context)
  await waitFor(() => screen.getByText("Search for a Prescription"))
  expect(screen.getByLabelText<HTMLInputElement>("Prescription ID").value).toEqual(prescriptionId)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays loading text while performing a summary search", async () => {
  const container = await renderPage()
  await enterNhsNumber()
  userEvent.click(screen.getByText("Search"))
  await waitFor(() => expect(screen.getByText("Loading...")).toBeTruthy())

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays results if summary search completes successfully", async () => {
  moxios.stubRequest(prescriptionSearchByNhsNumberUrl, {
    status: 200,
    response: summarySearchResult
  })

  const container = await renderPage()
  await enterNhsNumber()
  await clickSearchButton()
  expect(screen.getByText(prescriptionId)).toBeTruthy()
  expect(screen.getAllByText(formattedNhsNumber)).toHaveLength(5)

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays a message if summary search returns no results", async () => {
  const emptyBundle: Bundle = {
    resourceType: "Bundle",
    type: "searchset",
    total: 0,
    entry: []
  }
  moxios.stubRequest(prescriptionSearchByNhsNumberUrl, {
    status: 200,
    response: emptyBundle
  })

  const container = await renderPage()
  await enterNhsNumber()
  await clickSearchButton()
  expect(screen.getByText("No results found.")).toBeTruthy()

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays an error message if summary search returns an error", async () => {
  const errorResponse: OperationOutcome = {
    resourceType: "OperationOutcome",
    issue: [{
      severity: "fatal",
      code: "invalid",
      diagnostics: "Invalid query parameters."
    }]
  }
  moxios.stubRequest(prescriptionSearchByNhsNumberUrl, {
    status: 400,
    statusText: "Bad Request",
    response: errorResponse
  })

  const container = await renderPage()
  await enterNhsNumber()
  userEvent.click(screen.getByText("Search"))
  await waitFor(() => screen.getByText("Error"))

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays an error message if summary search returns invalid response", async () => {
  moxios.stubRequest(prescriptionSearchByNhsNumberUrl, {
    status: 500,
    statusText: "Internal Server Error",
    response: null
  })

  const container = await renderPage()
  await enterNhsNumber()
  userEvent.click(screen.getByText("Search"))
  await waitFor(() => screen.getByText("Error"))

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Clicking back from the summary search results returns to the form", async () => {
  moxios.stubRequest(prescriptionSearchByNhsNumberUrl, {
    status: 200,
    response: summarySearchResult
  })

  const container = await renderPage()
  await enterNhsNumber()
  await clickSearchButton()
  userEvent.click(screen.getByText("Back"))
  await waitFor(() => screen.getByText("Search for a Prescription"))

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays loading text while performing a detail search", async () => {
  moxios.stubRequest(prescriptionSearchByNhsNumberUrl, {
    status: 200,
    response: summarySearchResult
  })

  const container = await renderPage()
  await enterNhsNumber()
  await clickSearchButton()
  userEvent.click(screen.getAllByText("View Details")[0])
  await waitFor(() => screen.getByText("Loading..."))

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Displays results if detail search completes successfully", async () => {
  moxios.stubRequest(prescriptionSearchByNhsNumberUrl, {
    status: 200,
    response: summarySearchResult
  })
  moxios.stubRequest(prescriptionSearchByIdUrl, {
    status: 200,
    response: detailSearchResult
  })

  const container = await renderPage()
  await enterNhsNumber()
  await clickSearchButton()
  await clickViewDetailsLink()
  expect(screen.getByText(prescriptionId)).toBeTruthy()
  expect(screen.getByText(formattedNhsNumber)).toBeTruthy()
  expect(screen.getByText("Claimed")).toBeTruthy()
  expect(screen.getByText("SOMERSET BOWEL CANCER SCREENING CENTRE (A99968)")).toBeTruthy()
  expect(screen.getByText("NHS BUSINESS SERVICES AUTHORITY (T1450)")).toBeTruthy()

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Clicking back from the detail search results returns to the summary search", async () => {
  moxios.stubRequest(prescriptionSearchByNhsNumberUrl, {
    status: 200,
    response: summarySearchResult
  })
  moxios.stubRequest(prescriptionSearchByIdUrl, {
    status: 200,
    response: detailSearchResult
  })

  const container = await renderPage()
  await enterNhsNumber()
  await clickSearchButton()
  await clickViewDetailsLink()
  userEvent.click(screen.getByText("Back"))
  await waitFor(() => expect(screen.getByText("Search Results")).toBeTruthy())
  expect(screen.getByText(prescriptionId)).toBeTruthy()
  expect(screen.getAllByText(formattedNhsNumber)).toHaveLength(5)

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

async function renderPage() {
  const {container} = renderWithContext(<PrescriptionSearchPage/>, context)
  await waitFor(() => screen.getByText("Search for a Prescription"))
  return container
}

async function enterNhsNumber() {
  userEvent.type(screen.getByLabelText("NHS Number"), nhsNumber)
  await waitFor(
    () => expect(screen.getByLabelText<HTMLInputElement>("NHS Number").value).toEqual(formattedNhsNumber)
  )
}

async function clickSearchButton() {
  userEvent.click(screen.getByText("Search"))
  await waitFor(() => screen.getByText("Search Results"))
}

async function clickViewDetailsLink() {
  userEvent.click(screen.getAllByText("View Details")[0])
  await waitFor(() => screen.getByText("Prescription Details"))
}

import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import moxios from "moxios"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import {axiosInstance} from "../../src/requests/axiosInstance"
import {internalDevSandbox} from "../../src/services/environment"
import DoseToTextPage from "../../src/pages/doseToTextPage"
// import {readBundleFromFile} from "../messages"

const baseUrl = "baseUrl/"
const context: AppContextValue = { baseUrl, environment: internalDevSandbox }

// const doseToTextUrl = `${baseUrl}dose-to-text`
//
// const prescriptionExample = readBundleFromFile("prescriptionOrder.json")

beforeEach(() => moxios.install(axiosInstance))

afterEach(() => moxios.uninstall(axiosInstance))

test("Displays dose to text form on render", async () => {
  const container = await renderPage()
  expect(screen.getByText("Dose to Text")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

// test("Displays dose to text result when form data is set", async () => {
//   moxios.stubRequest(doseToTextUrl, {
//     status: 200,
//     response: {
//       results: [{
//         name: "0",
//         success: true
//       }],
//       success: true,
//       request: "JSON Request",
//       response: "JSON Response"
//     }
//   })

// })

async function renderPage() {
  const {container} = renderWithContext(<DoseToTextPage />, context)
  await waitFor(() => screen.getByText("Dose to Text"))
  return container
}

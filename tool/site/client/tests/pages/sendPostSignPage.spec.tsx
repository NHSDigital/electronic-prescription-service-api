import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import moxios from "moxios"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import SendPostSignPage from "../../src/pages/sendPostSignPage"
import {axiosInstance} from "../../src/requests/axiosInstance"
import {internalDev} from "../../src/services/environment"

const baseUrl = "baseUrl/"
const token = "MzQxMWJmMjUtMDNlMy00N2FiLWEyOGItMGIyYjVlNTg4ZGU3"
const context: AppContextValue = {baseUrl, environment: internalDev}

const sendUrl = `${baseUrl}prescribe/send`

beforeEach(() => moxios.install(axiosInstance))

afterEach(() => moxios.uninstall(axiosInstance))

test("Displays confirmation page if multiple prescriptions are sent successfully", async () => {
  moxios.stubRequest(sendUrl, {
    status: 200,
    response: {
      results: [
        {
          prescription_id: "003D4D-A99968-4C5AAJ",
          success: true
        },
        {
          prescription_id: "008070-A99968-41CD9V",
          success: true
        },
        {
          prescription_id: "010E34-A99968-467D9Z",
          success: false
        }
      ]
    }
  })

  const container = await renderPage()

  expect(screen.getByText("003D4D-A99968-4C5AAJ")).toBeTruthy()
  expect(screen.getByText("008070-A99968-41CD9V")).toBeTruthy()
  expect(screen.getByText("010E34-A99968-467D9Z")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

async function renderPage() {
  const {container} = renderWithContext(<SendPostSignPage token={token}/>, context)
  await waitFor(() => screen.getByText(/Send Result/))
  return container
}

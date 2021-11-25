import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import moxios from "moxios"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import ReleasePage from "../../src/pages/releasePage"

const baseUrl = "baseUrl/"
const prescriptionId = "7A9089-A83008-56A03J"
const context: AppContextValue = {baseUrl}

beforeEach(() => moxios.install())

afterEach(() => moxios.uninstall())

test("Displays release form", async () => {
  const container = await renderPage()

  expect(screen.getByText("Release prescription(s)")).toBeTruthy()
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

async function renderPage() {
  const {container} = renderWithContext(<ReleasePage prescriptionId={prescriptionId}/>, context)
  await waitFor(() => screen.getByText("Release prescription(s)"))
  return container
}

import {staticProductInfo} from "./props"
import {render, waitFor, waitForElementToBeRemoved} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import pretty from "pretty"
import * as React from "react"
import ClaimForm from "../../../src/components/claim/claimForm"

test("Renders correctly", async () => {
  const component = <ClaimForm products={[staticProductInfo]} sendClaim={jest.fn}/>
  const {container} = render(component)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Form has no endorsement fields initially", async () => {
  render(<ClaimForm products={[staticProductInfo]} sendClaim={jest.fn}/>)

  expect(screen.queryAllByLabelText(/Endorsement \d+ Type/)).toHaveLength(0)
  expect(screen.queryAllByLabelText(/Endorsement \d+ Supporting Information/)).toHaveLength(0)
  expect(screen.queryAllByText("Remove Endorsement")).toHaveLength(0)
})

test("Clicking Add Endorsement button adds one set of endorsement fields", async () => {
  render(<ClaimForm products={[staticProductInfo]} sendClaim={jest.fn}/>)

  userEvent.click(screen.getByText("Add Endorsement"))

  await expect(screen.findByLabelText("Endorsement 1 Type")).resolves.toBeTruthy()
  expect(screen.getByLabelText("Endorsement 1 Supporting Information")).toBeTruthy()
  expect(screen.queryByLabelText("Endorsement 2 Type")).toBeFalsy()
  expect(screen.queryByLabelText("Endorsement 2 Supporting Information")).toBeFalsy()
  expect(screen.queryAllByText("Remove Endorsement")).toHaveLength(1)
})

test("Clicking Add Endorsement button twice adds two sets of endorsement fields", async () => {
  render(<ClaimForm products={[staticProductInfo]} sendClaim={jest.fn}/>)

  userEvent.dblClick(screen.getByText("Add Endorsement"))

  await expect(screen.findByLabelText("Endorsement 2 Type")).resolves.toBeTruthy()
  expect(screen.getByLabelText("Endorsement 2 Supporting Information")).toBeTruthy()
  expect(screen.queryAllByText("Remove Endorsement")).toHaveLength(2)
})

test("Clicking Remove Endorsement button removes one set of endorsement fields", async () => {
  render(<ClaimForm products={[staticProductInfo]} sendClaim={jest.fn}/>)
  userEvent.dblClick(screen.getByText("Add Endorsement"))
  await expect(screen.findByLabelText("Endorsement 2 Type")).resolves.toBeTruthy()

  userEvent.click(screen.getAllByText("Remove Endorsement")[0])

  await waitFor(() => expect(screen.queryByLabelText("Endorsement 2 Type")).toBeFalsy())
  expect(screen.queryByLabelText("Endorsement 2 Supporting Information")).toBeFalsy()
  expect(screen.queryAllByText("Remove Endorsement")).toHaveLength(1)
})

//TODO - test submit
//TODO - test reset

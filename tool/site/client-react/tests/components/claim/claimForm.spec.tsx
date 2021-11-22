import {staticProductInfo} from "./props"
import {render, waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import pretty from "pretty"
import * as React from "react"
import ClaimForm from "../../../src/components/claim/claimForm"

test("Form has no endorsement fields initially", async () => {
  const {container} = render(<ClaimForm products={[staticProductInfo]} onSubmit={jest.fn}/>)

  expect(screen.queryAllByLabelText(/Endorsement \d+ Type/)).toHaveLength(0)
  expect(screen.queryAllByLabelText(/Endorsement \d+ Supporting Information/)).toHaveLength(0)
  expect(screen.queryAllByText("Remove Endorsement")).toHaveLength(0)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Clicking Add Endorsement button adds one set of endorsement fields", async () => {
  const {container} = render(<ClaimForm products={[staticProductInfo]} onSubmit={jest.fn}/>)

  await addEndorsement()

  expect(screen.getByLabelText("Endorsement 1 Type")).toBeTruthy()
  expect(screen.getByLabelText("Endorsement 1 Supporting Information")).toBeTruthy()
  expect(screen.queryByLabelText("Endorsement 2 Type")).toBeFalsy()
  expect(screen.queryByLabelText("Endorsement 2 Supporting Information")).toBeFalsy()
  expect(screen.queryAllByText("Remove Endorsement")).toHaveLength(1)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Clicking Add Endorsement button twice adds two sets of endorsement fields", async () => {
  const {container} = render(<ClaimForm products={[staticProductInfo]} onSubmit={jest.fn}/>)

  await addEndorsement()
  await addEndorsement()

  expect(screen.getByLabelText("Endorsement 2 Type")).toBeTruthy()
  expect(screen.getByLabelText("Endorsement 2 Supporting Information")).toBeTruthy()
  expect(screen.queryAllByText("Remove Endorsement")).toHaveLength(2)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Clicking Remove Endorsement button removes one set of endorsement fields", async () => {
  const {container} = render(<ClaimForm products={[staticProductInfo]} onSubmit={jest.fn}/>)
  await addEndorsement()
  await addEndorsement()

  await removeEndorsement()

  expect(screen.queryByLabelText("Endorsement 2 Type")).toBeFalsy()
  expect(screen.queryByLabelText("Endorsement 2 Supporting Information")).toBeFalsy()
  expect(screen.queryAllByText("Remove Endorsement")).toHaveLength(1)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Clicking Claim button calls the callback with form values", async () => {
  const submit = jest.fn()
  render(<ClaimForm products={[staticProductInfo]} onSubmit={submit}/>)

  await enterValuesInAllFields()

  userEvent.click(screen.getByText("Claim"))
  await waitFor(() => expect(submit).toHaveBeenCalled())

  expect(submit).toHaveBeenCalledWith({
    exemption: {
      code: "0005",
      evidenceSeen: true
    },
    products: [{
      ...staticProductInfo,
      patientPaid: true,
      endorsements: [{
        code: "IP",
        supportingInfo: "£210.91,100ml,Specials Ltd,Lic12345678,BN12345678"
      }]
    }]
  })
})

test("Clicking Reset button resets form to initial values", async () => {
  const submit = jest.fn()
  render(<ClaimForm products={[staticProductInfo]} onSubmit={submit}/>)

  await enterValuesInAllFields()

  userEvent.click(screen.getByText("Reset"))
  await waitFor(() => expect(screen.queryByLabelText("Endorsement 1 Type")).toBeFalsy())

  userEvent.click(screen.getByText("Claim"))
  await waitFor(() => expect(submit).toHaveBeenCalled())

  expect(submit).toHaveBeenCalledWith({
    exemption: {
      code: "0001",
      evidenceSeen: false
    },
    products: [{
      ...staticProductInfo,
      patientPaid: false,
      endorsements: []
    }]
  })
})

async function addEndorsement() {
  const initialEndorsementCount = screen.queryAllByText("Remove Endorsement").length
  userEvent.click(screen.getByText("Add Endorsement"))
  await waitFor(() =>
    expect(screen.queryAllByText("Remove Endorsement")).toHaveLength(initialEndorsementCount + 1)
  )
}

async function removeEndorsement() {
  const initialEndorsementCount = screen.queryAllByText("Remove Endorsement").length
  userEvent.click(screen.getAllByText("Remove Endorsement")[0])
  await waitFor(() =>
    expect(screen.queryAllByText("Remove Endorsement")).toHaveLength(initialEndorsementCount - 1)
  )
}

async function enterValuesInAllFields() {
  await addEndorsement()
  userEvent.click(screen.getByLabelText("Patient Paid"))
  userEvent.selectOptions(screen.getByLabelText("Endorsement 1 Type"), "IP")
  userEvent.type(screen.getByLabelText("Endorsement 1 Supporting Information"), "£210.91,100ml,Specials Ltd,Lic12345678,BN12345678")
  userEvent.selectOptions(screen.getByLabelText("Exemption Status"), "0005")
  userEvent.click(screen.getByLabelText("Evidence Seen"))
}

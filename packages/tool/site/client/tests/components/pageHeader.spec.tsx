import {render} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import * as React from "react"
import {PageHeader} from "../../src/components/pageHeader"
import {MemoryRouter} from "react-router-dom"

test("Header renders when logged in", async () => {
  const {container} = render(
    <MemoryRouter>
      <PageHeader loggedIn={true} />
    </MemoryRouter>
  )

  expect(screen.getByText("My Prescriptions")).toBeTruthy()

  expect(container.innerHTML).toMatchSnapshot()
})

test("Header renders when not logged in", async () => {
  const {container} = render(
    <MemoryRouter>
      <PageHeader loggedIn={false} />
    </MemoryRouter>
  )

  expect(screen.queryByText("My Prescriptions")).toBeNull()

  expect(container.innerHTML).toMatchSnapshot()
})

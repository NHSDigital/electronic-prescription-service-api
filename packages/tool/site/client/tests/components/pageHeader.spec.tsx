import {render, waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import pretty from "pretty"
import * as React from "react"
import {PageHeader} from "../../src/components/pageHeader"
import {expect} from "@jest/globals"
import {MemoryRouter} from "react-router-dom"

test("Header renders when logged in", async () => {
  const {container} = render(
    <MemoryRouter>
      <PageHeader loggedIn={true}/>
    </MemoryRouter>
  )

  expect(screen.getByText("My Prescriptions")).toBeTruthy()

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Header renders when not logged in", async () => {
    const {container} = render(
      <MemoryRouter>
        <PageHeader loggedIn={false}/>
      </MemoryRouter>
    )
  
    expect(screen.queryByText("My Prescriptions")).toBeNull()
  
    expect(pretty(container.innerHTML)).toMatchSnapshot()
})
  

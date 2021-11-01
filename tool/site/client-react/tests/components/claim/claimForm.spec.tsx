import {staticProductInfo} from "./props"
import {render} from "@testing-library/react"
import pretty from "pretty"
import * as React from "react"
import ClaimForm from "../../../src/components/claim/claimForm"

test("Renders correctly", async () => {
  const component = <ClaimForm products={[staticProductInfo]} sendClaim={jest.fn}/>
  const {container} = render(component)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

//TODO - test submit
//TODO - test reset
//TODO - test add endorsement
//TODO - test remove endorsement

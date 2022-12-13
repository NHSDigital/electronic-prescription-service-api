import React from "react"
import {render} from "@testing-library/react"
import SuccessOrFail from "../../../src/components/common/successOrFail"

test("Renders tick when condition is true", () => {
  const {container} = render(<SuccessOrFail condition={true}/>)
  const tickIcon = container.getElementsByClassName("nhsuk-icon__tick")[0]
  expect(tickIcon).toBeDefined()
})

test("Renders cross when condition is false", () => {
  const {container} = render(<SuccessOrFail condition={false}/>)
  const crossIcon = container.getElementsByClassName("nhsuk-icon__cross")[0]
  expect(crossIcon).toBeDefined()
})

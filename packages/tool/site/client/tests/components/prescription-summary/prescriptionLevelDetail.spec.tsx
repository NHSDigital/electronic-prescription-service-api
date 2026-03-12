import * as React from "react"
import {render} from "@testing-library/react"

import {prescriptionLevelDetailProps} from "./props"
import {PrescriptionLevelDetails} from "../../../src/components/prescription-summary/fragments/PrescriptionLevelDetails"

test("Renders correctly", async () => {
  const component = <PrescriptionLevelDetails {...prescriptionLevelDetailProps}/>
  const {container} = render(component)
  expect(container.innerHTML).toMatchSnapshot()
})

import * as React from "react"
import {render} from "@testing-library/react"
import pretty from "pretty"

import {prescriptionLevelDetailProps} from "./props"
import PrescriptionLevelDetails from "../../../src/components/prescription-summary/prescriptionLevelDetails";

test("Renders correctly", async () => {
  const component = <PrescriptionLevelDetails {...prescriptionLevelDetailProps}/>
  const {container} = render(component)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

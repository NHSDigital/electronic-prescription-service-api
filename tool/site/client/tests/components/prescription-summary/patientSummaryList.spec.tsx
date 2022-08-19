import * as React from "react"
import {PatientSummaryList} from "../../../src/components/prescription/fragments/PatientSummaryList"
import pretty from "pretty"
import {summaryPatient} from "./props"
import {render} from "@testing-library/react"

test("Renders correctly", async () => {
  const component = <PatientSummaryList {...summaryPatient}/>
  const {container} = render(component)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

import * as React from "react"
import {PractitionerRoleSummaryList} from "../../../src/components/prescription/fragments/PractitionerRoleSummaryList"
import pretty from "pretty"
import {summaryPractitionerRole} from "./props"
import {render} from "@testing-library/react"

test("Renders correctly", async () => {
  const component = <PractitionerRoleSummaryList {...summaryPractitionerRole}/>
  const {container} = render(component)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

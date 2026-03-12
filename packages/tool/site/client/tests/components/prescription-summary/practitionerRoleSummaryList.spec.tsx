import * as React from "react"
import {PractitionerRoleSummaryList} from "../../../src/components/prescription-summary/fragments/PractitionerRoleSummaryList"
import {summaryPractitionerRole} from "./props"
import {render} from "@testing-library/react"

test("Renders correctly", async () => {
  const component = <PractitionerRoleSummaryList {...summaryPractitionerRole}/>
  const {container} = render(component)
  expect(container.innerHTML).toMatchSnapshot()
})

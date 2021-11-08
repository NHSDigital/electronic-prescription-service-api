import * as React from "react"
import {render} from "@testing-library/react"
import pretty from "pretty"
import SelectField from "../../src/components/selectField"

test("Renders correctly", async () => {
  const component = <SelectField name={"test"} label={"test"} fieldOptions={[]}/>
  const {container} = render(component)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Renders correctly with many field options", async () => {
  const fieldOption = {value: "testValue", text: "testText"}
  const component = <SelectField name={"test"} label={"test"} fieldOptions={[fieldOption, fieldOption, fieldOption]}/>
  const {container} = render(component)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

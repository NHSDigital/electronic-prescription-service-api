import * as React from "react"
import {render} from "@testing-library/react"
import pretty from "pretty"
import SelectField from "../../src/components/common/selectField"
import {Formik, Form} from "formik"

const TestForm: React.FC<any> = ({children}) => <Formik initialValues={{}} onSubmit={jest.fn()}>
  <Form>
    {children}
  </Form>
</Formik>

test("Renders correctly", () => {
  const component = <SelectField id="test" name="test" label="test" fieldOptions={[]}/>
  const testForm = <TestForm>{component}</TestForm>

  const {container} = render(testForm)

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Renders correctly with many field options", () => {
  const fieldOption = {value: "testValue", text: "testText"}
  const component =
    <SelectField
      id="test"
      name="test"
      label="test"
      fieldOptions={
        [fieldOption, fieldOption, fieldOption].map(
          (option, index)=>({...option, id:index})
        )
      }
    />
  const testForm = <TestForm>{component}</TestForm>

  const {container} = render(testForm)

  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

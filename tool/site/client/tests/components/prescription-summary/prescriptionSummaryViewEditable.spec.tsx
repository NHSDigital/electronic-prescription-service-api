import * as React from "react"
import {PrescriptionSummaryView} from "../../../src/components/prescription-summary/PrescriptionSummaryView"
import {editableSummaryPrescription} from "./props"
import pretty from "pretty"
import {render} from "@testing-library/react"
import {Form, Formik} from "formik"

interface EditPrescriptionValues {
  numberOfCopies: string
  nominatedOds: string
  prescriptionId: string
}

const initialValues = {
  numberOfCopies: "1",
  nominatedOds: "FCG71",
  prescriptionId: "MOCK-PRESCRIPTION-ID"
}

const prescriptionForm = () => {
  const getViewProps = (errors) => {
    const props = editableSummaryPrescription
    props.editorProps.errors = errors
    return props
  }

  return (
    <Formik<EditPrescriptionValues>
      initialValues={initialValues}
      onSubmit={() => null}
      validate={() => null}
      validateOnBlur={false}
      validateOnChange={false}
    >
      {({handleSubmit, handleReset, errors}) =>
        <Form onSubmit={handleSubmit} onReset={handleReset}>
          <PrescriptionSummaryView {...getViewProps(errors)} />
        </Form>
      }
    </Formik>
  )
}

test("Renders correctly", async () => {
  const component = prescriptionForm()
  const {container} = render(component)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})


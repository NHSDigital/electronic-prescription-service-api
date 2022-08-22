import * as React from "react"
import {PrescriptionSummaryView} from "../../../src/components/prescription-summary/PrescriptionSummaryView"
import {editableSummaryPrescription} from "./props"
import pretty from "pretty"
import {render} from "@testing-library/react"
import { Form, Formik } from "formik"

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
          <PrescriptionSummaryView {...editableSummaryPrescription} />
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


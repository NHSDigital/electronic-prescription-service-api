import * as React from "react"
import {FieldArray, Formik} from "formik"
import {Button, Form} from "nhsuk-react-components"
import {LineItemStatus, PrescriptionStatus, VALUE_SET_NON_DISPENSING_REASON} from "./reference-data/valueSets"
import LineItemArray from "./lineItemArray"
import Prescription from "./prescription"

export interface DispenseFormProps {
  lineItems: Array<StaticLineItemInfo>
  prescription: StaticPrescriptionInfo
  sendDispenseNotification: (values: DispenseFormValues) => void
}

const DispenseForm: React.FC<DispenseFormProps> = ({
  lineItems,
  prescription,
  sendDispenseNotification
}) => {
  const initialValues: DispenseFormValues = {
    lineItems: lineItems.map(lineItem => ({
      ...lineItem,
      statusCode: lineItem.priorStatusCode,
      nonDispensingReasonCode: lineItem.priorNonDispensingReasonCode || VALUE_SET_NON_DISPENSING_REASON[0].code
    })),
    prescription: {
      ...prescription,
      statusCode: prescription.priorStatusCode
    }
  }

  return (
    <Formik<DispenseFormValues> initialValues={initialValues} onSubmit={values => sendDispenseNotification(values)}>
      {formik => {
        return (
          <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
            <FieldArray name="lineItems" component={LineItemArray}/>
            <Prescription name="prescription"/>
            <Button type="submit">Dispense</Button>
            <Button type="reset" secondary>Reset</Button>
          </Form>
        )
      }}
    </Formik>
  )
}

export interface DispenseFormValues {
  lineItems: Array<LineItemFormValues>
  prescription: PrescriptionFormValues
}

export interface StaticLineItemInfo {
  id: string
  name: string
  quantity: string
  priorStatusCode: LineItemStatus
  priorNonDispensingReasonCode?: string
}

export interface LineItemFormValues extends StaticLineItemInfo {
  statusCode: LineItemStatus
  nonDispensingReasonCode: string
}

export interface StaticPrescriptionInfo {
  priorStatusCode: PrescriptionStatus
}

export interface PrescriptionFormValues extends StaticPrescriptionInfo {
  statusCode: PrescriptionStatus
}

export default DispenseForm

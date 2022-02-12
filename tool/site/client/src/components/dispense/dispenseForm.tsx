import * as React from "react"
import {FieldArray, Formik} from "formik"
import {Button, Form} from "nhsuk-react-components"
import LineItemArray from "./lineItemArray"
import Prescription from "./prescription"
import ButtonList from "../buttonList"
import {LineItemStatus, PrescriptionStatus, VALUE_SET_NON_DISPENSING_REASON} from "../../fhir/reference-data/valueSets"
import BackButton from "../backButton"

export interface DispenseFormProps {
  lineItems: Array<StaticLineItemInfo>
  prescription: StaticPrescriptionInfo
  onSubmit: (values: DispenseFormValues) => void
}

const DispenseForm: React.FC<DispenseFormProps> = ({
  lineItems,
  prescription,
  onSubmit
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
    <Formik<DispenseFormValues> initialValues={initialValues} onSubmit={values => onSubmit(values)}>
      {formik =>
        <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
          <FieldArray name="lineItems" component={LineItemArray}/>
          <Prescription name="prescription"/>
          <ButtonList>
            <Button type="submit">Dispense</Button>
            <BackButton/>
          </ButtonList>
        </Form>
      }
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
  priorStatusCode: LineItemStatus
  prescribedQuantityUnit: string
  prescribedQuantityValue: number
  dispensedQuantityValue?: number
  priorNonDispensingReasonCode?: string
}

export interface LineItemFormValues extends StaticLineItemInfo {
  statusCode: LineItemStatus
  nonDispensingReasonCode?: string
  suppliedQuantityValue?: string
}

export interface StaticPrescriptionInfo {
  dispenseDate: Date
  priorStatusCode: PrescriptionStatus
}

export interface PrescriptionFormValues extends StaticPrescriptionInfo {
  statusCode: PrescriptionStatus
}

export default DispenseForm

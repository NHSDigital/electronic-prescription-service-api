import * as React from "react"
import {FieldArray, Formik} from "formik"
import {Button, Fieldset, Form} from "nhsuk-react-components"
import LineItemArray from "./lineItemArray"
import Prescription from "./prescription"
import ButtonList from "../common/buttonList"
import {LineItemStatus, PrescriptionStatus, VALUE_SET_NON_DISPENSING_REASON} from "../../fhir/reference-data/valueSets"
import BackButton from "../common/backButton"
import DispenseType from "./dispenseType"

export interface DispenseFormProps {
  lineItems: Array<StaticLineItemInfo>
  prescription: StaticPrescriptionInfo,
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
      nonDispensingReasonCode: lineItem.priorNonDispensingReasonCode || VALUE_SET_NON_DISPENSING_REASON[0].code,
      dispenseDifferentMedication: false
    })),
    prescription: {
      ...prescription,
      statusCode: prescription.priorStatusCode
    },
    dispenseType: "form"
  }

  return (
    <Formik<DispenseFormValues> initialValues={initialValues} onSubmit={values => onSubmit(values)}>
      {formik =>
        <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
          <Fieldset>
            <DispenseType
              initialValue={initialValues.dispenseType}
              value={formik.values.dispenseType}
              error={formik.errors.dispenseType}
            />
            {formik.values.dispenseType !== "custom" &&
              <>
                <FieldArray name="lineItems" component={LineItemArray}/>
                <Prescription name="prescription"/>
              </>
            }
          </Fieldset>
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
  prescription: PrescriptionFormValues,
  dispenseType: "form" | "custom",
  customDispenseFhir?: string
}

export interface StaticLineItemInfo {
  id: string
  name: string
  priorStatusCode: LineItemStatus
  prescribedQuantityUnit: string
  prescribedQuantityValue: number
  dispensedQuantityValue?: number
  priorNonDispensingReasonCode?: string
  alternativeMedicationAvailable?: boolean
}

export interface LineItemFormValues extends StaticLineItemInfo {
  statusCode: LineItemStatus
  nonDispensingReasonCode?: string
  suppliedQuantityValue?: string
  dispenseDifferentMedication?: boolean
}

export interface StaticPrescriptionInfo {
  dispenseDate: Date
  priorStatusCode: PrescriptionStatus
}

export interface PrescriptionFormValues extends StaticPrescriptionInfo {
  statusCode: PrescriptionStatus
}

export default DispenseForm

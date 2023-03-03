import {Fieldset, Select} from "nhsuk-react-components"
import {Field, useFormikContext} from "formik"
import * as React from "react"
import {DispenseFormValues} from "./dispenseForm"
import PrescriptionSummaryList from "./prescriptionSummaryList"
import {LineItemStatus, PrescriptionStatus, VALUE_SET_PRESCRIPTION_STATUS} from "../../fhir/reference-data/valueSets"

export interface PrescriptionProps {
  name: string
}

const Prescription: React.FC<PrescriptionProps> = ({name}) => {
  const {values, touched, setFieldValue} = useFormikContext<DispenseFormValues>()
  React.useEffect(() => {
    if (touched.prescription?.statusCode) {
      return
    }
    const lineItemStatuses = values?.lineItems?.map(lineItem => lineItem.statusCode)
    const derivedPrescriptionStatus = derivePrescriptionStatusFromLineItemStatuses(lineItemStatuses)
    if (derivedPrescriptionStatus) {
      setFieldValue("prescription.statusCode", derivedPrescriptionStatus)
    }
  }, [touched.prescription?.statusCode, values?.lineItems, setFieldValue])

  return (
    <Fieldset>
      <Fieldset.Legend size="m">Prescription Status</Fieldset.Legend>
      <PrescriptionSummaryList name={name}/>
      <Field id={`${name}.statusCode`} name={`${name}.statusCode`} as={Select} label="Status">
        {VALUE_SET_PRESCRIPTION_STATUS.map(coding =>
          <Select.Option key={coding.code} value={coding.code}>{coding.display}</Select.Option>
        )}
      </Field>
    </Fieldset>
  )
}

function derivePrescriptionStatusFromLineItemStatuses(lineItemStatuses: Array<LineItemStatus>): string {
  //To be dispensed
  if (lineItemStatuses.find(status => status === LineItemStatus.TO_BE_DISPENSED)) {
    return PrescriptionStatus.TO_BE_DISPENSED
  }
  //With dispenser
  if (lineItemStatuses.find(status => status === LineItemStatus.WITH_DISPENSER)) {
    return PrescriptionStatus.WITH_DISPENSER
  }
  //Cancelled
  if (lineItemStatuses.every(status => status === LineItemStatus.CANCELLED)) {
    return PrescriptionStatus.CANCELLED
  }
  //Not dispensed
  if (lineItemStatuses.every(status => [
    LineItemStatus.NOT_DISPENSED,
    LineItemStatus.CANCELLED
  ].includes(status))) {
    return PrescriptionStatus.NOT_DISPENSED
  }
  //Expired
  if (lineItemStatuses.every(status => [
    LineItemStatus.EXPIRED,
    LineItemStatus.NOT_DISPENSED,
    LineItemStatus.CANCELLED
  ].includes(status))) {
    return PrescriptionStatus.EXPIRED
  }
  //With dispenser active
  if (lineItemStatuses.find(status => [
    LineItemStatus.PARTIALLY_DISPENSED,
    LineItemStatus.OWING
  ].includes(status))) {
    return PrescriptionStatus.PARTIALLY_DISPENSED
  }
  //Dispensed
  if (lineItemStatuses.every(status => [
    LineItemStatus.DISPENSED,
    LineItemStatus.EXPIRED,
    LineItemStatus.CANCELLED,
    LineItemStatus.NOT_DISPENSED
  ].includes(status))) {
    return PrescriptionStatus.DISPENSED
  }
}

export default Prescription

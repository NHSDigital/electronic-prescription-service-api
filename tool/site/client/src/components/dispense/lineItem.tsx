import React from "react"
import {Checkboxes, Fieldset, Input} from "nhsuk-react-components"
import LineItemSummaryList from "./lineItemSummaryList"
import ConditionalField from "../conditionalField"
import {LineItemFormValues} from "./dispenseForm"
import {
  LineItemStatus,
  VALUE_SET_LINE_ITEM_STATUS,
  VALUE_SET_NON_DISPENSING_REASON
} from "../../fhir/reference-data/valueSets"
import SelectField, {convertCodingsToOptions} from "../selectField"

interface LineItemProps {
  name: string
  lineItem: LineItemFormValues
}

const LineItem: React.FC<LineItemProps> = ({name, lineItem}) => (
  <Fieldset>
    <Fieldset.Legend size="m">{lineItem.name}</Fieldset.Legend>
    <LineItemSummaryList {...lineItem}/>
    <SelectField
      id={`${name}.statusCode`}
      name={`${name}.statusCode`}
      label="Status"
      fieldOptions={convertCodingsToOptions(VALUE_SET_LINE_ITEM_STATUS)}
    />
    <ConditionalField
      id={`${name}.nonDispensingReasonCode`}
      name={`${name}.nonDispensingReasonCode`}
      condition={lineItem.statusCode === LineItemStatus.NOT_DISPENSED}
      as={SelectField}
      label="Reason"
      fieldOptions={convertCodingsToOptions(VALUE_SET_NON_DISPENSING_REASON)}
    />
    <ConditionalField
      id={`${name}.dispenseDifferentMedication`}
      name={`${name}.dispenseDifferentMedication`}
      condition={lineItem.alternativeMedicationAvailable}
      as={Checkboxes.Box}
      label="Dispense Different Medication"
    />
    <ConditionalField
      id={`${name}.suppliedQuantityValue`}
      name={`${name}.suppliedQuantityValue`}
      condition={lineItem.statusCode === LineItemStatus.PARTIALLY_DISPENSED}
      as={Input}
      label="Quantity Dispensed"
    />
  </Fieldset>
)

export default LineItem

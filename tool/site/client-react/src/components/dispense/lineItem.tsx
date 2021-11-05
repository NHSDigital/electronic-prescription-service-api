import * as React from "react"
import {Fieldset, Select} from "nhsuk-react-components"
import LineItemSummaryList from "./lineItemSummaryList"
import {Field} from "formik"
import ConditionalField from "../conditionalField"
import {LineItemFormValues} from "./dispenseForm"
import {
  LineItemStatus, VALUE_SET_DISPENSER_ENDORSEMENT,
  VALUE_SET_LINE_ITEM_STATUS,
  VALUE_SET_NON_DISPENSING_REASON
} from "../../fhir/reference-data/valueSets"
import SelectField, {convertCodingsToOptions} from "../SelectField"

interface LineItemProps {
  name: string
  lineItem: LineItemFormValues
}

const LineItem: React.FC<LineItemProps> = ({name, lineItem}) => (
  <Fieldset>
    <Fieldset.Legend size="m">{lineItem.name}</Fieldset.Legend>
    <LineItemSummaryList {...lineItem}/>
    <SelectField
      fieldName={`${name}.statusCode`}
      label={`Status`}
      fieldOptions={convertCodingsToOptions(VALUE_SET_LINE_ITEM_STATUS)}
    />
    <ConditionalField
      condition={lineItem.statusCode === LineItemStatus.NOT_DISPENSED}
      fieldName={`${name}.nonDispensingReasonCode`}
      fieldOptions={convertCodingsToOptions(VALUE_SET_NON_DISPENSING_REASON)}
      label="Reason"
    />
  </Fieldset>
)

export default LineItem

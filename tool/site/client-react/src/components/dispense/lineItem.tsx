import * as React from "react"
import {Fieldset, Select} from "nhsuk-react-components"
import LineItemSummaryList from "./lineItemSummaryList"
import {Field} from "formik"
import {VALUE_SET_LINE_ITEM_STATUS, VALUE_SET_NON_DISPENSING_REASON} from "./reference-data/valueSets"
import ConditionalField from "../conditionalField"
import {LineItemFormValues} from "./dispenseForm"

const LINE_ITEM_STATUS_NOT_DISPENSED = "0002"

interface LineItemProps {
  name: string
  lineItem: LineItemFormValues
}

const LineItem: React.FC<LineItemProps> = ({name, lineItem}) => (
  <Fieldset>
    <Fieldset.Legend size="m">{lineItem.name}</Fieldset.Legend>
    <LineItemSummaryList {...lineItem}/>
    <Field id={`${name}.statusCode`} name={`${name}.statusCode`} as={Select} label="Status">
      {VALUE_SET_LINE_ITEM_STATUS.map(coding =>
        <Select.Option key={coding.code} value={coding.code}>{coding.display}</Select.Option>
      )}
    </Field>
    <ConditionalField
      condition={lineItem.statusCode === LINE_ITEM_STATUS_NOT_DISPENSED}
      id={`${name}.nonDispensingReasonCode`}
      name={`${name}.nonDispensingReasonCode`}
      as={Select}
      label="Reason"
    >
      {VALUE_SET_NON_DISPENSING_REASON.map(coding =>
        <Select.Option key={coding.code} value={coding.code}>{coding.display}</Select.Option>
      )}
    </ConditionalField>
  </Fieldset>
)

export default LineItem

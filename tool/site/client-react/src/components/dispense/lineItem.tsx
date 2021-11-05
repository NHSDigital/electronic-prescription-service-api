import React from "react"
import {Fieldset, Select} from "nhsuk-react-components"
import LineItemSummaryList from "./lineItemSummaryList"
import ConditionalField from "../conditionalField"
import {LineItemFormValues} from "./dispenseForm"
import {
  LineItemStatus,
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
    <ConditionallyRender condition={lineItem.statusCode === LineItemStatus.NOT_DISPENSED}>
      <SelectField
        fieldName={`${name}.nonDispensingReasonCode`}
        label={"Reason"}
        fieldOptions={convertCodingsToOptions(VALUE_SET_NON_DISPENSING_REASON)}
      />
    </ConditionallyRender>
    <ConditionalField
      condition={lineItem.statusCode === LineItemStatus.NOT_DISPENSED}
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

interface ConditionallyRenderProps {
  condition: boolean
  children?: React.ReactNode
}

const ConditionallyRender: React.FC<ConditionallyRenderProps> = ({condition, children}) => {
  return condition && <>{children}</>
}

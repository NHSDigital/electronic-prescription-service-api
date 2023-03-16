import * as React from "react"
import {FieldArrayRenderProps, getIn} from "formik"
import LineItem from "./lineItem"
import {LineItemFormValues} from "./dispenseForm"

const LineItemArray: React.FC<FieldArrayRenderProps> = ({form, name}) => {
  const lineItems = getIn(form.values, name)
  return lineItems.map(
    (lineItem: LineItemFormValues, index: any) =>
      <LineItem
        key={lineItem.id}
        name={`${name}.${index}`}
        lineItem={lineItem}
      />
  )
}

export default LineItemArray

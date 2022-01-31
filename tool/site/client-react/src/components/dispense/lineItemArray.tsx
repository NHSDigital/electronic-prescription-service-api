import * as React from "react"
import {FieldArrayRenderProps, getIn} from "formik"
import LineItem from "./lineItem"

const LineItemArray: React.FC<FieldArrayRenderProps> = ({form, name}) => {
  const lineItems = getIn(form.values, name)
  return lineItems.map((lineItem, index) => <LineItem key={index} name={`${name}.${index}`} lineItem={lineItem}/>)
}

export default LineItemArray

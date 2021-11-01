import {Checkboxes, Fieldset} from "nhsuk-react-components"
import ProductSummaryList from "./productSummaryList"
import {Field, FieldArray} from "formik"
import EndorsementArray from "./endorsementArray"
import * as React from "react"
import {StaticProductInfo} from "./claimForm"

interface ProductProps {
  name: string
  product: StaticProductInfo
}

const Product: React.FC<ProductProps> = ({
  name,
  product
}) => (
  <Fieldset>
    <Fieldset.Legend size="m">{product.name}</Fieldset.Legend>
    <ProductSummaryList {...product}/>
    <Checkboxes id={`${name}.patientPaid.boxes`}>
      <Field id={`${name}.patientPaid.box`} name={`${name}.patientPaid`} type="checkbox" as={Checkboxes.Box}>
        Patient Paid
      </Field>
    </Checkboxes>
    <FieldArray name={`${name}.endorsements`} component={EndorsementArray}/>
  </Fieldset>
)

export default Product

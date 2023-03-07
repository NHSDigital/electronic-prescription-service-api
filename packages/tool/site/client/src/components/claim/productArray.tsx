import * as React from "react"
import {FieldArrayRenderProps} from "formik/dist/FieldArray"
import {getIn} from "formik"
import Product from "./product"
import {ProductFormValues} from "./claimForm"

const ProductArray: React.FC<FieldArrayRenderProps> = ({form, name}) => {
  const products: Array<ProductFormValues> = getIn(form.values, name)
  return (
    <>
      {products.map((product, productIndex) =>
        <Product key={`${name}.${product.id}`} name={`${name}.${productIndex}`} product={product}/>
      )}
    </>
  )
}

export default ProductArray

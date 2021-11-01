import * as React from "react"
import {FieldArrayRenderProps} from "formik/dist/FieldArray"
import {getIn} from "formik"
import Product from "./product"

const ProductArray: React.FC<FieldArrayRenderProps> = ({form, name}) => {
  const products = getIn(form.values, name)
  return (
    <>
      {products.map((product, productIndex) =>
        <Product key={productIndex} name={`${name}.${productIndex}`} product={product}/>
      )}
    </>
  )
}

export default ProductArray

import {Button, Form} from "nhsuk-react-components"
import * as React from "react"
import {FieldArray, Formik} from "formik"
import {VALUE_SET_PRESCRIPTION_CHARGE_EXEMPTION} from "./reference-data/valueSets"
import Exemption from "./exemption"
import ProductArray from "./productArray"
import ButtonList from "../buttonList"

export interface ClaimFormProps {
  products: Array<StaticProductInfo>
  sendClaim: (claim: ClaimFormValues) => void
}

const ClaimForm: React.FC<ClaimFormProps> = ({
  products,
  sendClaim
}) => {
  const initialValues: ClaimFormValues = {
    products: products.map(product => ({
      ...product,
      patientPaid: false,
      endorsements: []
    })),
    exemption: {
      code: VALUE_SET_PRESCRIPTION_CHARGE_EXEMPTION[0].code,
      evidenceSeen: false
    }
  }

  return (
    <Formik<ClaimFormValues> initialValues={initialValues} onSubmit={values => sendClaim(values)}>
      {formik =>
        <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
          <FieldArray name="products" component={ProductArray}/>
          <Exemption name="exemption"/>
          <ButtonList>
            <Button type="submit">Claim</Button>
            <Button type="reset" secondary>Reset</Button>
          </ButtonList>
        </Form>
      }
    </Formik>
  )
}

export interface ClaimFormValues {
  products: Array<ProductFormValues>
  exemption: ExemptionFormValues
}

export interface StaticProductInfo {
  id: string
  name: string
  status: string
  quantityDispensed: string
}

export interface ProductFormValues extends StaticProductInfo {
  patientPaid: boolean
  endorsements: Array<EndorsementFormValues>
}

export interface EndorsementFormValues {
  code: string
  supportingInfo: string
}

export interface ExemptionFormValues {
  code: string
  evidenceSeen: boolean
}

export default ClaimForm

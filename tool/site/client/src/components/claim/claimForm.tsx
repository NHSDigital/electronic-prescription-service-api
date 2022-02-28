import {Button, Form} from "nhsuk-react-components"
import * as React from "react"
import {FieldArray, Formik} from "formik"
import Exemption from "./exemption"
import ProductArray from "./productArray"
import ButtonList from "../common/buttonList"
import {PRESCRIPTION_CHARGE_EXEMPTION_CODE_NONE} from "../../fhir/reference-data/valueSets"
import BackButton from "../common/backButton"

export interface ClaimFormProps {
  products: Array<StaticProductInfo>
  onSubmit: (claim: ClaimFormValues) => void
}

const ClaimForm: React.FC<ClaimFormProps> = ({
  products,
  onSubmit
}) => {
  const initialValues: ClaimFormValues = {
    products: products.map(product => ({
      ...product,
      patientPaid: false,
      endorsements: []
    })),
    exemption: {
      code: PRESCRIPTION_CHARGE_EXEMPTION_CODE_NONE,
      evidenceSeen: false
    }
  }

  return (
    <Formik<ClaimFormValues> initialValues={initialValues} onSubmit={values => onSubmit(values)}>
      {formik =>
        <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
          <FieldArray name="products" component={ProductArray}/>
          <Exemption name="exemption"/>
          <ButtonList>
            <Button type="submit">Claim</Button>
            <BackButton/>
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

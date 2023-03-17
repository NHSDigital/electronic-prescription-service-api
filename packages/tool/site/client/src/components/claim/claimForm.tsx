import * as React from "react"
import {Button, Form} from "nhsuk-react-components"
import {FieldArray, Formik} from "formik"
import Exemption from "./exemption"
import ProductArray from "./productArray"
import ButtonList from "../common/buttonList"
import BackButton from "../common/backButton"

export interface ClaimFormProps {
  initialValues: ClaimFormValues
  onSubmit: (claim: ClaimFormValues) => void
}

const ClaimForm: React.FC<ClaimFormProps> = ({
  initialValues,
  onSubmit
}) => {
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
  id?: number
  code: string
  supportingInfo: string
}

export interface ExemptionFormValues {
  code: string
  evidenceSeen: boolean
}

export default ClaimForm

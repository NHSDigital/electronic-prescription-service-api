import {Button, Checkboxes, Fieldset, Form, Input, Select, SummaryList} from "nhsuk-react-components"
import * as React from "react"
import {Field, FieldArray, Formik, getIn} from "formik"
import {FieldArrayRenderProps} from "formik/dist/FieldArray"
import {VALUE_SET_DISPENSER_ENDORSEMENT, VALUE_SET_PRESCRIPTION_CHARGE_EXEMPTION} from "./reference-data/valueSets"

export interface ClaimProps {
  products: Array<StaticProductInfo>
  sendClaim: (claim: ClaimFormValues) => void
}

const Claim: React.FC<ClaimProps> = ({
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
    <Formik<ClaimFormValues> initialValues={initialValues} onSubmit={sendClaim}>
      {formik =>
        <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
          <FieldArray name="products" component={ClaimProducts}/>
          <ClaimExemption name="exemption"/>
          <Button type="submit">Claim</Button>
          <Button type="reset" secondary>Reset</Button>
        </Form>
      }
    </Formik>
  )
}

const ClaimProducts: React.FC<FieldArrayRenderProps> = ({form, name}) => {
  const products = getIn(form.values, name)
  return (
    <>
      {products.map((product, productIndex) =>
        <ClaimProduct key={productIndex} name={`${name}.${productIndex}`} product={product}/>
      )}
    </>
  )
}

const ClaimProduct = ({name, product}) => (
  <Fieldset>
    <Fieldset.Legend size="m">{product.name}</Fieldset.Legend>
    <ClaimProductSummaryList {...product}/>
    <Checkboxes>
      <Field name={`${name}.patientPaid`} type="checkbox" as={Checkboxes.Box}>Patient Paid</Field>
    </Checkboxes>
    <FieldArray name={`${name}.endorsements`} component={ClaimEndorsements}/>
  </Fieldset>
)

const ClaimProductSummaryList = ({status, quantityDispensed}) => (
  <SummaryList noBorder>
    <SummaryList.Row>
      <SummaryList.Key>Status</SummaryList.Key>
      <SummaryList.Value>{status}</SummaryList.Value>
    </SummaryList.Row>
    <SummaryList.Row>
      <SummaryList.Key>Quantity Dispensed</SummaryList.Key>
      <SummaryList.Value>{quantityDispensed}</SummaryList.Value>
    </SummaryList.Row>
  </SummaryList>
)

const ClaimEndorsements: React.FC<FieldArrayRenderProps> = ({form, name, push, remove}) => {
  const initialEndorsementValues: EndorsementFormValues = {
    code: VALUE_SET_DISPENSER_ENDORSEMENT[0].code,
    supportingInfo: ""
  }

  const endorsements = getIn(form.values, name)
  return (
    <>
      {endorsements.map((endorsement, index) =>
        <ClaimEndorsement
          key={index}
          name={`${name}.${index}`}
          label={`Endorsement ${index + 1}`}
          removeEndorsement={() => remove(index)}
        />
      )}
      <div>
        <Button type="button" onClick={() => push(initialEndorsementValues)}>Add Endorsement</Button>
      </div>
    </>
  )
}

const ClaimEndorsement = ({name, label, removeEndorsement}) => (
  <>
    <Field name={`${name}.code`} as={Select} label={`${label} Type`}>
      {VALUE_SET_DISPENSER_ENDORSEMENT.map(coding =>
        <Select.Option key={coding.code} value={coding.code}>{coding.display}</Select.Option>
      )}
    </Field>
    <Field name={`${name}.supportingInfo`} as={Input} width={30} label={`${label} Supporting Information`}/>
    <div>
      <Button type="button" onClick={removeEndorsement} secondary>Remove Endorsement</Button>
    </div>
  </>
)

const ClaimExemption = ({name}) => (
  <Fieldset>
    <Fieldset.Legend size="m">Prescription Charge Exemption</Fieldset.Legend>
    <Field name={`${name}.code`} as={Select} label="Exemption Status">
      {VALUE_SET_PRESCRIPTION_CHARGE_EXEMPTION.map(coding =>
        <Select.Option key={coding.code} value={coding.code}>{coding.display}</Select.Option>
      )}
    </Field>
    <Checkboxes>
      <Field name={`${name}.evidenceSeen`} type="checkbox" as={Checkboxes.Box}>Evidence Seen</Field>
    </Checkboxes>
  </Fieldset>
)

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

export default Claim

import {Button, Checkboxes, Fieldset, Form, Input, Label, Select, SummaryList} from "nhsuk-react-components"
import * as React from "react"
import dispenserEndorsementCodings from "./reference-data/dispenserEndorsementCodings"
import * as fhir from "fhir/r4"
import {createClaim, getMedicationDispenseLineItemId} from "./createDispenseClaim"
import {getTaskBusinessStatusExtension} from "../../fhir/customExtensions"
import {Field, FieldArray, Formik} from "formik"
import chargeExemptionCodings from "./reference-data/chargeExemptionCodings"

export interface ClaimProps {
  patient: fhir.Patient
  medicationRequests: Array<fhir.MedicationRequest>
  medicationDispenses: Array<fhir.MedicationDispense>
  sendClaim: (claim: fhir.Claim) => void
}

const Claim: React.FC<ClaimProps> = ({
  patient,
  medicationRequests,
  medicationDispenses,
  sendClaim
}) => {
  const initialValues: ClaimFormValues = {
    productInfo: medicationDispenses.map(toProductInfo),
    exemptionInfo: {
      exemptionStatus: chargeExemptionCodings[0].code,
      evidenceSeen: false
    }
  }

  const onSubmit = values => {
    const claim = createClaim(patient, medicationRequests, medicationDispenses, values)
    sendClaim(claim)
  }

  return (
    <Formik<ClaimFormValues> initialValues={initialValues} onSubmit={onSubmit}>
      {formik =>
        <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
          <Label isPageHeading>Claim for Dispensed Medication</Label>
          <FieldArray name="productInfo">
            {() =>
              <>
                {formik.values.productInfo.map((product, productIndex) =>
                  <ClaimProduct key={productIndex} name={`productInfo.${productIndex}`} product={product}/>
                )}
              </>
            }
          </FieldArray>
          <Field name="exemptionInfo.exemptionStatus" as={Select}>
            {chargeExemptionCodings.map(coding =>
              <Select.Option key={coding.code} value={coding.code}>{coding.display}</Select.Option>
            )}
          </Field>
          <Checkboxes>
            <Field name="exemptionInfo.evidenceSeen" as={Checkboxes.Box}>
              Evidence Seen
            </Field>
          </Checkboxes>
          <Button type="submit">Claim</Button>
          <Button type="reset" secondary>Reset</Button>
        </Form>
      }
    </Formik>
  )
}

const ClaimProduct = ({name, product}) => {
  const initialEndorsementValues: EndorsementInfo = {
    code: dispenserEndorsementCodings[0].code,
    supportingInfo: ""
  }

  return (
    <Fieldset>
      <Fieldset.Legend size="m">{product.name}</Fieldset.Legend>
      <ClaimProductSummaryList {...product}/>
      <Checkboxes>
        <Field name={`${name}.patientPaid`} as={Checkboxes.Box}>Patient Paid</Field>
      </Checkboxes>
      <FieldArray name={`${name}.endorsements`}>
        {({push, remove}) =>
          <>
            {product.endorsements.map((endorsement, index) =>
              <ClaimEndorsement
                key={index}
                name={`${name}.endorsements.${index}`}
                label={`Endorsement ${index + 1}`}
                removeEndorsement={() => remove(index)}
              />
            )}
            <div>
              <Button type="button" onClick={() => push(initialEndorsementValues)}>Add Endorsement</Button>
            </div>
          </>
        }
      </FieldArray>
    </Fieldset>
  )
}

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

const ClaimEndorsement = ({name, label, removeEndorsement}) => (
  <>
    <Field name={`${name}.code`} as={Select} label={label}>
      {dispenserEndorsementCodings.map(coding =>
        <Select.Option key={coding.code} value={coding.code}>{coding.display}</Select.Option>
      )}
    </Field>
    <Field name={`${name}.supportingInfo`} as={Input} width={30} label={`${label} Supporting Information`}/>
    <div>
      <Button type="button" onClick={removeEndorsement} secondary>Remove Endorsement</Button>
    </div>
  </>
)

export interface ClaimFormValues {
  productInfo: Array<ProductInfo>
  exemptionInfo: ExemptionInfo
}

export interface ProductInfo {
  id: string
  name: string
  status: string
  quantityDispensed: string
  patientPaid: boolean
  endorsements: Array<EndorsementInfo>
}

export interface EndorsementInfo {
  code: string
  supportingInfo: string
}

export interface ExemptionInfo {
  exemptionStatus: string
  evidenceSeen: boolean
}

function toProductInfo(medicationDispense: fhir.MedicationDispense): ProductInfo {
  return {
    id: getMedicationDispenseLineItemId(medicationDispense),
    name: medicationDispense.medicationCodeableConcept.coding[0].display,
    quantityDispensed: `${medicationDispense.quantity.value} ${medicationDispense.quantity.unit}`,
    status: getTaskBusinessStatusExtension(medicationDispense.extension).valueCoding.display,
    patientPaid: false,
    endorsements: []
  }
}

export default Claim

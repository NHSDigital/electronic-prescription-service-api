import * as React from "react"
import {Button, Form} from "nhsuk-react-components"
import {FieldArray, Formik} from "formik"
import Exemption from "./exemption"
import ProductArray from "./productArray"
import ButtonList from "../common/buttonList"
import {PRESCRIPTION_CHARGE_EXEMPTION_CODE_NONE} from "../../fhir/reference-data/valueSets"
import BackButton from "../common/backButton"
import * as fhir from "fhir/r4"
import {getClaimMedicationRequestReferenceExtension} from "../../fhir/customExtensions"

export interface ClaimFormProps {
  products: Array<StaticProductInfo>
  onSubmit: (claim: ClaimFormValues) => void
  previousClaim?: fhir.Claim
}

const ClaimForm: React.FC<ClaimFormProps> = ({
  products,
  onSubmit,
  previousClaim
}) => {
  const initialValues = getInitialValues(products, previousClaim)

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

function getInitialValues(products: Array<StaticProductInfo>, previousClaim?: fhir.Claim): ClaimFormValues {
  if (previousClaim) {
    const productInfo = getProductInfo(products, previousClaim)
    const exemptionInfo = getExemptionInfo(previousClaim)
    return {
      products: productInfo,
      exemption: exemptionInfo
    }
  } else {
    const defaultValues: ClaimFormValues = {
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
    return defaultValues
  }
}

function getProductInfo(products: Array<StaticProductInfo>, previousClaim: fhir.Claim): Array<ProductFormValues> {
  const claimDetails = previousClaim.item.flatMap(item => item.detail)
  return claimDetails.map(detail => {
    const claimDetailIdentifierExtension = getClaimMedicationRequestReferenceExtension(detail.extension)
    const claimDetailIdentifier = claimDetailIdentifierExtension.valueReference.identifier.value

    const associatedProduct = products.find(product => product.id === claimDetailIdentifier)

    return {
      ...associatedProduct,
      patientPaid: getPatientPaid(detail),
      endorsements: getEndorsementInfo(detail)
    }
  })
}

function getEndorsementInfo(detail: fhir.ClaimItemDetail): Array<EndorsementFormValues> {
  const endorsementCodeableConcepts = detail.programCode
    .filter(codeableConcept => codeableConcept.coding
      .some(coding => coding.system === "https://fhir.nhs.uk/CodeSystem/medicationdispense-endorsement"))
  return endorsementCodeableConcepts.map(codeableConcept => ({
    code: codeableConcept.coding.find(coding => coding.system === "https://fhir.nhs.uk/CodeSystem/medicationdispense-endorsement").code,
    supportingInfo: codeableConcept?.text
  }))
}

function getPatientPaid(detail: fhir.ClaimItemDetail): boolean {
  const patientPaidCoding = detail.programCode
    .flatMap(codeableConcept => codeableConcept.coding)
    .find(coding => coding.system === "https://fhir.nhs.uk/CodeSystem/DM-prescription-charge")
  return patientPaidCoding.code === "paid-once"
}

function getExemptionInfo(previousClaim: fhir.Claim): ExemptionFormValues {
  const programCodeCodings = previousClaim.item
    .flatMap(item => item.programCode)
    .flatMap(codeableConcept => codeableConcept.coding)

  const exemptionCoding = programCodeCodings.find(coding => coding.system === "https://fhir.nhs.uk/CodeSystem/prescription-charge-exemption")
  const exemptionCode = exemptionCoding.code

  const evidenceSeenCoding = programCodeCodings.find(coding => coding.system === "https://fhir.nhs.uk/CodeSystem/DM-exemption-evidence")
  const evidenceSeenCode = evidenceSeenCoding.code

  return {
    code: exemptionCode,
    evidenceSeen: evidenceSeenCode === "evidence-seen"
  }
}

export default ClaimForm

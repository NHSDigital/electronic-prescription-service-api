import {Formik} from "formik"
import {Button, Fieldset, Form, SummaryList} from "nhsuk-react-components"
import React from "react"
import {VALUE_SET_RETURN_STATUS_REASON} from "../../fhir/reference-data/valueSets"
import BackButton from "../common/backButton"
import ButtonList from "../common/buttonList"
import PharmacyRadios from "../common/pharmacies"
import RadioField from "../common/radioField"
import {convertCodingsToOptions} from "../common/selectField"

interface ReturnFormProps {
  prescriptionId?: string
  onSubmit: (values: ReturnFormValues) => void
}

export interface ReturnFormValues {
  prescriptionId: string
  pharmacy: string
  reason: string
  customPharmacy?: string
}

const ReturnForm: React.FC<ReturnFormProps> = ({
  prescriptionId,
  onSubmit
}) => {
  const initialValues: ReturnFormValues = {prescriptionId, pharmacy: "VNFKT", reason: "0002"}
  return (
    <>
      <SummaryList>
        <SummaryList.Row>
          <SummaryList.Key>ID</SummaryList.Key>
          <SummaryList.Value>{prescriptionId}</SummaryList.Value>
        </SummaryList.Row>
      </SummaryList>
      <Formik<ReturnFormValues> initialValues={initialValues} onSubmit={values => onSubmit(values)}>
        {formik => <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
          <Fieldset>
            <PharmacyRadios
              label="Pharmacy returning prescription"
              defaultValue={initialValues.pharmacy}
              value={formik.values.pharmacy}
              error={formik.errors.pharmacy} />
            <RadioField
              name="reason"
              label="Choose a reason for returning"
              defaultValue={initialValues.reason}
              fieldRadios={convertCodingsToOptions(VALUE_SET_RETURN_STATUS_REASON)} />
          </Fieldset>
          <ButtonList>
            <Button type="submit">Return</Button>
            <BackButton />
          </ButtonList>
        </Form>}
      </Formik>
    </>
  )
}

export default ReturnForm

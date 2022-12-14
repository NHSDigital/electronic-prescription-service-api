import {Formik} from "formik"
import {Button, Fieldset, Form} from "nhsuk-react-components"
import React from "react"
import {VALUE_SET_WITHDRAW_STATUS_REASON} from "../../fhir/reference-data/valueSets"
import BackButton from "../common/backButton"
import ButtonList from "../common/buttonList"
import PharmacyRadios from "../common/pharmacies"
import RadioField from "../common/radioField"
import {convertCodingsToOptions} from "../common/selectField"

export interface WithdrawFormValues {
  prescriptionId: string
  pharmacy: string
  reason: string
  customPharmacy?: string
}

interface WithdrawFormProps {
  prescriptionId?: string
  onSubmit: (values: WithdrawFormValues) => void
}

const WithdrawForm: React.FC<WithdrawFormProps> = ({
  prescriptionId,
  onSubmit
}) => {
  const initialValues: WithdrawFormValues = {prescriptionId, pharmacy: "VNFKT", reason: "0002"}
  return (
    <Formik<WithdrawFormValues> initialValues={initialValues} onSubmit={values => onSubmit(values)}>
      {formik => <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
        <Fieldset>
          <PharmacyRadios
            label="Pharmacy withdrawing prescription"
            defaultValue={initialValues.pharmacy}
            value={formik.values.pharmacy}
            error={formik.errors.pharmacy} />
          <RadioField
            name="reason"
            label="Choose a reason for withdrawing"
            defaultValue={initialValues.reason}
            fieldRadios={convertCodingsToOptions(VALUE_SET_WITHDRAW_STATUS_REASON)} />
        </Fieldset>
        <ButtonList>
          <Button type="submit">Withdraw</Button>
          <BackButton />
        </ButtonList>
      </Form>}
    </Formik>
  )
}

export default WithdrawForm

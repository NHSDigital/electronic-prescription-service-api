import * as React from "react"
import {useState} from "react"
import {FieldArray, Formik, useField} from "formik"
import {Button, CrossIcon, Form, Input, Label, TickIcon} from "nhsuk-react-components"
import {VALUE_SET_NON_DISPENSING_REASON} from "./reference-data/valueSets"
import LineItemArray from "./lineItemArray"
import axios from "axios"

export interface DispenseFormProps {
  lineItems: Array<StaticLineItemInfo>
  sendDispenseNotification: (values: DispenseFormValues) => void
}

const DispenseForm: React.FC<DispenseFormProps> = ({
  lineItems,
  sendDispenseNotification
}) => {
  const initialValues: DispenseFormValues = {
    lineItems: lineItems.map(lineItem => ({
      ...lineItem,
      statusCode: lineItem.priorStatusCode,
      nonDispensingReasonCode: VALUE_SET_NON_DISPENSING_REASON[0].code
    }))
  }

  return (
    <Formik<DispenseFormValues> initialValues={initialValues} onSubmit={values => sendDispenseNotification(values)}>
      {formik => (
        <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
          <FieldArray name="lineItems" component={LineItemArray}/>
          <Button type="submit">Dispense</Button>
          <Button type="reset" secondary>Reset</Button>
        </Form>
      )}
    </Formik>
  )
}

interface OdsCodeFieldProps {
  name: string
}

const OdsCodeField: React.FC<OdsCodeFieldProps> = ({name, ...props}) => {
  const [field] = useField(name)
  const [organizationFound, setOrganizationFound] = useState<boolean>()
  const [organizationName, setOrganizationName] = useState<string>()

  async function lookupOrganization(odsCode: string) {
    try {
      const response = await axios.get(`https://directory.spineservices.nhs.uk/STU3/Organization/${odsCode}`)
      setOrganizationName(response.data.name)
      setOrganizationFound(true)
    } catch (e) {
      setOrganizationName(undefined)
      setOrganizationFound(false)
    }
  }

  return (
    <>
      <Input width={10} {...field} {...props} onBlur={event => {
        field.onBlur(event)
        lookupOrganization(field.value)
      }}/>
      {organizationFound === true && <TickIcon/>}
      {organizationFound === false && <CrossIcon/>}
      {organizationName && <Label>{organizationName}</Label>}
    </>
  )
}

export interface DispenseFormValues {
  lineItems: Array<LineItemFormValues>
}

export interface StaticLineItemInfo {
  id: string
  name: string
  quantity: string
  priorStatusCode: string
}

export interface LineItemFormValues extends StaticLineItemInfo {
  statusCode: string
  nonDispensingReasonCode: string
}

export default DispenseForm

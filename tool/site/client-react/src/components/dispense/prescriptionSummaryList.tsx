import {SummaryList} from "nhsuk-react-components"
import * as React from "react"
import {useField} from "formik"
import {PrescriptionFormValues} from "./dispenseForm"
import {VALUE_SET_PRESCRIPTION_STATUS} from "../../fhir/reference-data/valueSets"

interface PrescriptionSummaryListProps {
  name: string
}

const PrescriptionSummaryList: React.FC<PrescriptionSummaryListProps> = ({name}) => {
  const [field] = useField(name)
  const {priorStatusCode}: PrescriptionFormValues = field.value
  const priorStatusDesc = VALUE_SET_PRESCRIPTION_STATUS.find(coding => coding.code === priorStatusCode).display
  return (
    <SummaryList noBorder>
      <SummaryList.Row>
        <SummaryList.Key>Prior Status</SummaryList.Key>
        <SummaryList.Value>{priorStatusDesc}</SummaryList.Value>
      </SummaryList.Row>
    </SummaryList>
  )
}

export default PrescriptionSummaryList

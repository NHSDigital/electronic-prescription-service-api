import React, {useContext} from "react"
import {useHistory} from "react-router-dom"
import LongRunningTask from "../components/common/longRunningTask"
import PrescriptionSearchResultsDetail from "../components/prescription-tracker/prescriptionSearchResultsDetail"
import {AppContext} from "../index"
import {FullPrescriptionDetails, retrieveFullPrescriptionDetails} from "./prescriptionSearchPage"

interface PrescriptionSearchPageProps {
  prescriptionId?: string
}

const PrescriptionSearchPage: React.FC<PrescriptionSearchPageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)
  const history = useHistory()

  return (
    <LongRunningTask<FullPrescriptionDetails>
      task={() => retrieveFullPrescriptionDetails(baseUrl, prescriptionId)}
      loadingMessage="Retrieving full prescription details."
    >
      {prescriptionDetails => <PrescriptionSearchResultsDetail prescriptionDetails={prescriptionDetails} back={() => history.goBack()}/>}
    </LongRunningTask>
  )
}

export default PrescriptionSearchPage

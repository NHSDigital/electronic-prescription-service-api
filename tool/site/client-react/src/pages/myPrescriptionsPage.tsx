import * as React from "react"
import {useContext} from "react"
import {Label} from "nhsuk-react-components"
import {AppContext} from "../index"
import LongRunningTask from "../components/longRunningTask"
import {axiosInstance} from "../requests/axiosInstance"
import MyPrescriptions, {Prescriptions} from "../components/my-prescriptions/myPrescriptions"

const MyPrescriptionsPage: React.FC = () => {
  const {baseUrl} = useContext(AppContext)
  const retrievePrescriptionsTask = () => retrievePrescriptions(baseUrl)

  return (
    <LongRunningTask<Prescriptions> task={retrievePrescriptionsTask} loadingMessage="Retrieving prescriptions.">
      {prescriptions => {
        const noPrescriptions = !prescriptions.sentPrescriptions.length && !prescriptions.releasedPrescriptions.length
        if (noPrescriptions) {
          return (
            <>
              <Label isPageHeading>My Prescriptions</Label>
              <p>You do not have any active prescriptions. Once you create or release a prescription you will see it here</p>
            </>
          )
        }
        return (
          <>
            <Label isPageHeading>My Prescriptions</Label>
            <MyPrescriptions {...prescriptions} />
          </>
        )
      }}
    </LongRunningTask>
  )
}

async function retrievePrescriptions(baseUrl: string): Promise<Prescriptions> {
  return await (await axiosInstance.get<Prescriptions>(`${baseUrl}prescriptions`)).data
}

export default MyPrescriptionsPage

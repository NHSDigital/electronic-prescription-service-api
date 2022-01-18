import * as React from "react"
import {useContext} from "react"
import {Label, Table} from "nhsuk-react-components"
import {AppContext} from "../index"
import LongRunningTask from "../components/longRunningTask"
import axios from "axios"
import PrescriptionActions from "../components/prescriptionActions"

const MyPrescriptionsPage: React.FC = () => {
  const {baseUrl} = useContext(AppContext)
  const retrievePrescriptionsTask = () => retrievePrescriptions(baseUrl)

  return (
    <LongRunningTask<Prescriptions> task={retrievePrescriptionsTask} loadingMessage="Retrieving prescriptions.">
      {prescriptions => {
        if (!prescriptions.sentPrescriptions.length && !prescriptions.releasedPrescriptions.length) {
          return (
            <>
              <Label isPageHeading>My Prescriptions</Label>
              <p>You do not have any active prescriptions. Once you send or release a prescription you will see it here</p>
            </>
          )
        }
        return (
          <>
            <Label isPageHeading>My Prescriptions</Label>
            {!!prescriptions.sentPrescriptions.length &&
              <Table.Panel heading="Sent Prescriptions">
                <Table caption="Prescriptions ready to release">
                  <Table.Head>
                    <Table.Row>
                      <Table.Cell>ID</Table.Cell>
                      <Table.Cell>Actions</Table.Cell>
                    </Table.Row>
                  </Table.Head>
                  <Table.Body>
                    {prescriptions.sentPrescriptions.map(prescription =>
                      <Table.Row>
                        <Table.Cell>{prescription.id}</Table.Cell>
                        <Table.Cell>
                          <PrescriptionActions prescriptionId={prescription.id} view release />
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table>
              </Table.Panel>
            }
            {!!prescriptions.releasedPrescriptions.length &&
              <Table.Panel heading="Released Prescriptions">
                <Table caption="Prescriptions ready to dispense">
                  <Table.Head>
                    <Table.Row>
                      <Table.Cell>ID</Table.Cell>
                      <Table.Cell>Actions</Table.Cell>
                    </Table.Row>
                  </Table.Head>
                  <Table.Body>
                    {prescriptions.releasedPrescriptions.map(prescription =>
                      <Table.Row>
                        <Table.Cell>{prescription.id}</Table.Cell>
                        <Table.Cell>
                          <PrescriptionActions prescriptionId={prescription.id} view dispense />
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table>
              </Table.Panel>
            }
          </>
        )
      }}
    </LongRunningTask>
  )
}

interface Prescriptions {
  sentPrescriptions: Array<PrescriptionSummary>
  releasedPrescriptions: Array<PrescriptionSummary>
}

interface PrescriptionSummary {
  id: string
}

async function retrievePrescriptions(baseUrl: string): Promise<Prescriptions> {
  return await (await axios.get<Prescriptions>(`${baseUrl}prescriptions`)).data
}

export default MyPrescriptionsPage

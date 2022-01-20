import * as React from "react"
import {useContext} from "react"
import {Label, Table} from "nhsuk-react-components"
import {AppContext} from "../index"
import LongRunningTask from "../components/longRunningTask"
import {axiosInstance} from "../requests/axiosInstance"
import PrescriptionActions from "../components/prescriptionActions"

const MyPrescriptionsPage: React.FC = () => {
  const {baseUrl} = useContext(AppContext)
  const retrievePrescriptionsTask = () => retrievePrescriptions(baseUrl)

  return (
    <LongRunningTask<Prescriptions> task={retrievePrescriptionsTask} loadingMessage="Retrieving prescriptions.">
      {prescriptions => {
        if (!prescriptions.any) {
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
            <PrescriptionGroupTable
              name="Sent Prescriptions"
              description="Prescriptions ready to release"
              prescriptions={prescriptions.sentPrescriptions}
              actions={{view: true, release: true}}
            />
            <PrescriptionGroupTable
              name="Released Prescriptions"
              description="Prescriptions ready to dispense"
              prescriptions={prescriptions.releasedPrescriptions}
              actions={{view: true, returnRelease: true, dispense: true}}
            />
          </>
        )
      }}
    </LongRunningTask>
  )
}

interface Prescriptions {
  any: boolean
  sentPrescriptions: Array<PrescriptionSummary>
  releasedPrescriptions: Array<PrescriptionSummary>
}

interface PrescriptionSummary {
  id: string
}

async function retrievePrescriptions(baseUrl: string): Promise<Prescriptions> {
  return await (await axiosInstance.get<Prescriptions>(`${baseUrl}prescriptions`)).data
}

interface PrescriptionGroupTableProps {
  name: string
  description: string
  prescriptions: Array<{id: string}>
  actions: PrescriptionActionProps
}

interface PrescriptionActionProps {
  view?: boolean
  release?: boolean
  returnRelease?: boolean
  dispense?: boolean
  claim?: boolean
}

export const PrescriptionGroupTable: React.FC<PrescriptionGroupTableProps> = ({
  name,
  description,
  prescriptions,
  actions
}) => {
  if (!prescriptions.length) {
    return null
  }
  return (
    <Table.Panel heading={name}>
      <Table caption={description}>
        <Table.Head>
          <Table.Row>
            <Table.Cell>ID</Table.Cell>
            <Table.Cell>Actions</Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {prescriptions.map(prescription =>
            <Table.Row>
              <Table.Cell>{prescription.id}</Table.Cell>
              <Table.Cell>
                <PrescriptionActions prescriptionId={prescription.id} {...actions}/>
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </Table.Panel>
  )
}

export default MyPrescriptionsPage

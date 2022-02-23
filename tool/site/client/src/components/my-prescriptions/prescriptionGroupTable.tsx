import {Table} from "nhsuk-react-components"
import React from "react"
import PrescriptionActions from "../prescriptionActions"

interface PrescriptionGroupTableProps {
  name: string
  description: string
  prescriptions: Array<string>
  actions: PrescriptionActionProps
}

interface PrescriptionActionProps {
  view?: boolean
  release?: boolean
  verify?: boolean
  releaseReturn?: boolean
  withdraw?: boolean
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
          {prescriptions.map((prescription, index) =>
            <Table.Row key={index}>
              <Table.Cell>{prescription}</Table.Cell>
              <Table.Cell>
                <PrescriptionActions prescriptionId={prescription} {...actions}/>
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </Table.Panel>
  )
}

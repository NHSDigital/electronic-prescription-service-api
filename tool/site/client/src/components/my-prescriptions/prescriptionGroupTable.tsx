import {Label, Table} from "nhsuk-react-components"
import React from "react"
import PrescriptionActions, {Actions} from "../common/prescriptionActions"
import ComparePrescriptionCheckbox from "./comparePrescriptionCheckbox"

interface PrescriptionGroupTableProps {
  name: string
  description: string
  prescriptions: Array<string>
  actions: Actions
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
              <Table.Cell>
                <Label>{prescription}</Label>
                <ComparePrescriptionCheckbox name={name} prescriptionId={prescription}/>
              </Table.Cell>
              <Table.Cell>
                <PrescriptionActions prescriptionId={prescription} {...actions} />
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </Table.Panel>
  )
}

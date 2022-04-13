import * as React from "react"
import {Label, Button, Table, TickIcon, CrossIcon, ActionLink} from "nhsuk-react-components"
import ButtonList from "../common/buttonList"
import {Spinner} from "../common/loading"
import {AppContext} from "../../index"
import {SendBulkResult} from "../../pages/sendPostSignPage"

interface BulkResultTableProps {
  bulkResults: SendBulkResult
}

export const BulkResultTable: React.FC<BulkResultTableProps> = ({bulkResults}) => {
  const {baseUrl} = React.useContext(AppContext)
  return (
    <>
      <Label isPageHeading>Send Results</Label>
      <ButtonList>
        <Button onClick={() => copyPrescriptionIds(bulkResults)}>Copy Prescription IDs</Button>
        {bulkResults.results.every(s => s.success !== "unknown")
          && <Button href={`${baseUrl}download/exception-report`}>Download Exception Report</Button>
        }
      </ButtonList>
      <Table>
        <Table.Head>
          <Table.Row>
            <Table.Cell>Bundle ID</Table.Cell>
            <Table.Cell>Prescription ID</Table.Cell>
            <Table.Cell>Success</Table.Cell>
            <Table.Cell />
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {bulkResults.results.map(result => (
            <Table.Row key={result.prescription_id}>
              <Table.Cell>{result.bundle_id}</Table.Cell>
              <Table.Cell>{result.prescription_id}</Table.Cell>
              <Table.Cell>{result.success === "unknown" ? <Spinner /> : result.success ? <TickIcon /> : <CrossIcon />}</Table.Cell>
              <Table.Cell>
                {result.success && <ActionLink href={`${baseUrl}view?prescription_id=${encodeURIComponent(result.prescription_id)}`}></ActionLink>}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </>
  )
}

function copyPrescriptionIds(sendBulkResult: SendBulkResult) {
  const prescriptionIds = sendBulkResult.results.map(r => r.prescription_id)
  navigator.clipboard.writeText(prescriptionIds.join("\n"))
}

import * as React from "react"
import {Label, Button, Table, ActionLink} from "nhsuk-react-components"
import ButtonList from "../common/buttonList"
import {Spinner} from "../common/loading"
import {AppContext} from "../../index"
import {SendResult} from "../../pages/sendPage"
import SuccessOrFail from "../common/successOrFail"

interface ResultSummariesProps {
  sendResult: SendResult
}

export const ResultSummaries: React.FC<ResultSummariesProps> = ({sendResult}) => {
  const {baseUrl} = React.useContext(AppContext)
  return (
    <>
      <Label isPageHeading>Send Results</Label>
      <ButtonList>
        <Button onClick={() => copyPrescriptionIds(sendResult)}>Copy Prescription IDs</Button>
        {sendResult.results.every(s => s.success !== "unknown")
          && <Button href={`${baseUrl}download/exception-report`}>Download Exception Report</Button>
        }
      </ButtonList>
      <Table>
        <Table.Head>
          <Table.Row>
            <Table.Cell>Bundle ID</Table.Cell>
            <Table.Cell>Prescription ID</Table.Cell>
            <Table.Cell>Success</Table.Cell>
            <Table.Cell/>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {sendResult.results.map(result => (
            <Table.Row key={result.prescription_id}>
              <Table.Cell>{result.bundle_id}</Table.Cell>
              <Table.Cell>{result.prescription_id}</Table.Cell>
              <Table.Cell>{result.success === "unknown" ? <Spinner /> : <SuccessOrFail condition={result.success} />}</Table.Cell>
              <Table.Cell>
                {result.success && <ActionLink href={`${baseUrl}view?prescription_id=${encodeURIComponent(result.prescription_id)}`}>View</ActionLink>}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </>
  )
}

function copyPrescriptionIds(sendResult: SendResult) {
  const prescriptionIds = sendResult.results.map(r => r.prescription_id)
  navigator.clipboard.writeText(prescriptionIds.join("\n"))
}

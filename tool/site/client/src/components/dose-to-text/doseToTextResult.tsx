import * as React from "react"
import {Label, Table} from "nhsuk-react-components"
import ButtonList from "../common/buttonList"
import BackButton from "../common/backButton"
import LongRunningTask from "../common/longRunningTask"
import MessageExpanders from "../messageExpanders"
import {ApiResult} from "../../requests/apiResult"
import {DosageTranslation} from "../../../../server/src/routes/dose-to-text"
import SuccessOrFail from "../common/successOrFail"

interface DoseToTextResultProps {
  task: () => Promise<DoseToTextApiResult>
}

export interface DoseToTextApiResult extends ApiResult {
  results: Array<DosageTranslation>
}

const DoseToTextResult: React.FC<DoseToTextResultProps> = ({
  task
}) => {
  return (
    <LongRunningTask<DoseToTextApiResult> task={task} loadingMessage="Translating structured dosage to text.">
      {doseToTextResult => (
        <>
          <Label isPageHeading> Dose to Text Result {<SuccessOrFail condition={doseToTextResult.success} />}</Label>
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.Cell>Medication Identifier</Table.Cell>
                <Table.Cell>Dosage translation</Table.Cell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {doseToTextResult.results.map(result => (
                <Table.Row key={result.identifier[0].value}>
                  <Table.Cell>{result.identifier[0].value}</Table.Cell>
                  <Table.Cell>{result.dosageInstructionText}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          <MessageExpanders
            fhirRequest={doseToTextResult.request}
            fhirResponse={doseToTextResult.response}
          />
          <ButtonList>
            <BackButton />
          </ButtonList>
        </>
      )}
    </LongRunningTask>
  )
}

export default DoseToTextResult

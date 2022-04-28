import * as React from "react"
import {Label, Table} from "nhsuk-react-components"
import ButtonList from "../common/buttonList"
import BackButton from "../common/backButton"
import LongRunningTask from "../common/longRunningTask"
import MessageExpanders from "../messageExpanders"
import {ApiResult} from "../../requests/apiResult"
import SuccessOrFail from "../common/successOrFail"

interface VerifyResultProps {
  task: () => Promise<VerifyApiResult>
}

export interface VerifyApiResult extends ApiResult {
  results: Array<SignatureResult>
}

interface SignatureResult {
  name: string
  success: boolean
}

const VerifyResult: React.FC<VerifyResultProps> = ({
  task
}) => {
  return (
    <LongRunningTask<VerifyApiResult> task={task} loadingMessage="Verifying prescription.">
      {verifyResult => (
        <>
          <Label isPageHeading>Verify Result {<SuccessOrFail condition={verifyResult.success} />}</Label>
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.Cell>Signature Name</Table.Cell>
                <Table.Cell>Success</Table.Cell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {verifyResult.results.map(result => (
                <Table.Row key={result.name}>
                  <Table.Cell>{result.name}</Table.Cell>
                  <Table.Cell>{<SuccessOrFail condition={result.success} />}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          <MessageExpanders
            fhirRequest={verifyResult.request}
            fhirResponse={verifyResult.response}
          />
          <ButtonList>
            <BackButton />
          </ButtonList>
        </>
      )}
    </LongRunningTask>
  )
}

export default VerifyResult

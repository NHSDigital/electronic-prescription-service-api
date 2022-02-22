import * as React from "react"
import {CrossIcon, Label, Table, TickIcon} from "nhsuk-react-components"
import ButtonList from "../../components/buttonList"
import BackButton from "../../components/backButton"
import LongRunningTask from "../longRunningTask"
import MessageExpanders from "../messageExpanders"
import {ApiResult} from "../../requests/apiResult"

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
          <Label isPageHeading>Verify Result {verifyResult.success ? <TickIcon /> : <CrossIcon />}</Label>
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
                  <Table.Cell>{result.success ? <TickIcon/> : <CrossIcon/>}</Table.Cell>
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

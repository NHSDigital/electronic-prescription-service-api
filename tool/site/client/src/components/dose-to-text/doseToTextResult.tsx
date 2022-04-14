// import * as React from "react"
// import {CrossIcon, Label, Table, TickIcon} from "nhsuk-react-components"
// import ButtonList from "../common/buttonList"
// import BackButton from "../common/backButton"
// import LongRunningTask from "../common/longRunningTask"
// import MessageExpanders from "../messageExpanders"
// import {ApiResult} from "../../requests/apiResult"
//
// interface DoseToTextResultProps {
//   task: () => Promise<VerifyApiResult>
// }
//
// export interface DoseToTextApiResult extends ApiResult {
//   results: Array<DoseToTextResult>
// }
//
// interface DoseToTextResult {
//   name: string
//   success: boolean
// }

// const DoseToTextResult: React.FC<DoseToTextResultProps> = ({
//   message
// }) => {
//   return (
//     <LongRunningTask<VerifyApiResult> message={message} loadingMessage="Verifying prescription.">
//       {verifyResult => (
//         <>
//           <Label isPageHeading>Verify Result {verifyResult.success ? <TickIcon /> : <CrossIcon />}</Label>
//           <Table>
//             <Table.Head>
//               <Table.Row>
//                 <Table.Cell>Signature Name</Table.Cell>
//                 <Table.Cell>Success</Table.Cell>
//               </Table.Row>
//             </Table.Head>
//             <Table.Body>
//               {verifyResult.results.map(result => (
//                 <Table.Row key={result.name}>
//                   <Table.Cell>{result.name}</Table.Cell>
//                   <Table.Cell>{result.success ? <TickIcon/> : <CrossIcon/>}</Table.Cell>
//                 </Table.Row>
//               ))}
//             </Table.Body>
//           </Table>
//           <MessageExpanders
//             fhirRequest={verifyResult.request}
//             fhirResponse={verifyResult.response}
//           />
//           <ButtonList>
//             <BackButton />
//           </ButtonList>
//         </>
//       )}
//     </LongRunningTask>
//   )
// }
//
// export default DoseToTextResult

import {DispensePropsalReturnHandler} from "../../../../../src/services/translation/response/spine-return-handler"
import pino from "pino"
import {DispenseProposalReturnFactory} from "../../../../../src/services/translation/request/return/return-factory"
import {ReturnReasonCode} from "../../../../../../models/hl7-v3"
import {getExamplePrescriptionReleaseResponse, validTestHeaders} from "../../../../resources/test-resources"
import {spineClient} from "../../../../../src/services/communication/spine-client"

describe("handle ", () => {
  //const spineClient = {send: jest.fn(), poll: jest.fn(), getStatus: jest.fn()}
  const mockPayloadFactory = {createPayload: jest.fn()}
  const logger = pino()
  const dispensePropsalReturnhandler = new DispensePropsalReturnHandler(
    validTestHeaders,
    mockPayloadFactory,
    spineClient)

  const factory = new DispenseProposalReturnFactory()
  const releaseResponse = getExamplePrescriptionReleaseResponse("release_success.xml")
  const reasonCode = new ReturnReasonCode("0005", "Invalid Digital Signature")

  test("should create payload per purposal ", () => {
    // spineClient.send.mockReturnValueOnce({})
    mockPayloadFactory.createPayload.mockReturnValueOnce({})
    const dispenseProposalReturns = [ factory.create(releaseResponse, reasonCode), factory.create(releaseResponse, reasonCode) ]
    dispensePropsalReturnhandler.handle(logger, dispenseProposalReturns)
    expect(mockPayloadFactory.createPayload).toBeCalledTimes(2)
  })
})

//  function createMockLogger() {
//   return {
//     level: "error",
//     info: jest.fn(),
//     error: jest.fn(),
//     warn: jest.fn(),
//     debug: jest.fn(),
//     fatal: jest.fn(),
//     trace: jest.fn(),
//     silent: jest.fn()
//   }

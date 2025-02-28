import pino from "pino"
import {v4} from "uuid"
import {DispenseProposalReturnFactory} from "../../src/services/translation/request/return/return-factory"
import {
  DispenseProposalReturnPertinentInformation1,
  DispenseProposalReturnPertinentInformation3,
  DispenseProposalReturnReversalOf,
  DispenseProposalReturnRoot,
  ReturnReasonCode
} from "../../../models/hl7-v3"
import {
  getExamplePrescriptionReleaseResponse,
  getExamplePrescriptionReleaseResponseString,
  validTestHeaders
} from "../resources/test-resources"
import {getParentPrescription} from "../resources/test-helpers"
import {
  DispenseReturnPayloadFactory
} from "../../src/services/translation/request/return/payload/return-payload-factory"
import {ReleaseResponseHandler} from "../../src/services/translation/response/spine-response-handler"
import {DispensePropsalReturnHandler} from "../../src/services/translation/response/spine-return-handler"
import {spineClient} from "../../src/services/communication/spine-client"

jest.mock("uuid")
;(v4 as jest.Mock).mockImplementation(() => "test-uuid")

describe("create", () => {
  const returnPayloadFactory = new DispenseProposalReturnFactory()
  const releaseResponse = getExamplePrescriptionReleaseResponse("release_success.xml")
  const prescription = getParentPrescription(releaseResponse)
  const returnReasonCode = new ReturnReasonCode("0005", "Invalid digital signature")
  const logger = pino()
  const loggerSpy = jest.spyOn(logger, "info")
  const result = returnPayloadFactory.create(prescription, releaseResponse, returnReasonCode, logger)
  const dispenseProposalReturnResult = result.DispenseProposalReturn
  const author = prescription.pertinentInformation1.pertinentPrescription.author
  test("should return instance of DispenseProposalReturnRoot", () => {
    expect(result).toBeInstanceOf(DispenseProposalReturnRoot)
  })

  test("should return DispenseProposalReturnRoot with newly generated ID", () => {
    expect(dispenseProposalReturnResult.id._attributes.root).toEqual("test-uuid")
  })

  test("should log newly generated ID", () => {
    const prescriptionId = prescription.pertinentInformation1.pertinentPrescription.id[1]._attributes.extension
    expect(loggerSpy).toHaveBeenCalledWith(
      "Generating auto return message: test-uuid for prescription: " + prescriptionId
    )
  })

  test("should return DispenseProposal with dateTime from effectiveTime", () => {
    expect(dispenseProposalReturnResult.effectiveTime).toEqual(releaseResponse.effectiveTime)
  })

  describe("DispenseProposalReturn should have", () => {
    test("author set from release response auther", () => {
      const authorName = author.AgentPerson.agentPerson.name.family._text
      const authorOrganisation = author.AgentPerson.representedOrganization.name._text
      expect(dispenseProposalReturnResult.author.AgentPerson).toEqual(author.AgentPerson)
      expect(authorName).toBe("BOIN")
      expect(authorOrganisation).toBe("HALLGARTH SURGERY")
    })

    test("author set as SDS role from release response", () => {
      const sdsCode = author.AgentPerson.code._attributes.code
      expect(dispenseProposalReturnResult.author.AgentPerson).toEqual(author.AgentPerson)
      expect(sdsCode).toBe("R8000")
    })

    test("pertinentInformation1 is instance of DispenseProposalReturnPertinentInformation1", () => {
      expect(dispenseProposalReturnResult.pertinentInformation1).toBeInstanceOf(
        DispenseProposalReturnPertinentInformation1
      )
    })

    test("pertinentInformation1 set with prescriptionId", () => {
      const actualId =
        dispenseProposalReturnResult.pertinentInformation1.pertinentPrescriptionID.value._attributes.extension
      const expectedId = prescription.pertinentInformation1.pertinentPrescription.id[1]._attributes.extension
      expect(actualId).toEqual(expectedId)
    })

    test("pertinentInformation3 is instance of DispenseProposalReturnPertinentInformation3", () => {
      expect(dispenseProposalReturnResult.pertinentInformation3).toBeInstanceOf(
        DispenseProposalReturnPertinentInformation3
      )
    })

    test("returnReasonValue set with provided value", () => {
      const expectedReturnReason = returnReasonCode
      const actualReturnReason = dispenseProposalReturnResult.pertinentInformation3.pertinentReturnReason.value
      expect(actualReturnReason).toEqual(expectedReturnReason)
    })

    test("reverseOf is instance of DispenseProposalReturnReversalOf", () => {
      expect(dispenseProposalReturnResult.reversalOf).toBeInstanceOf(DispenseProposalReturnReversalOf)
    })
  })
})

describe("full successful response", () => {
  const releaseResponse = getExamplePrescriptionReleaseResponseString("full_successful_release.xml")
  const logger = pino()
  const dispenseReturnPayloadFactory = new DispenseReturnPayloadFactory()
  const releaseResponseHandler = new ReleaseResponseHandler(
    "PORX_IN070101UK31",
    new DispensePropsalReturnHandler(validTestHeaders, dispenseReturnPayloadFactory, spineClient)
  )

  test("status code should be 200 for a full successful release response", async () => {
    const result = await releaseResponseHandler.handleResponse(releaseResponse, logger)
    expect(result.statusCode).toEqual(200)
  }, 10000)
})

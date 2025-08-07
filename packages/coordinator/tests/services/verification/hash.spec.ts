import * as TestResources from "../../resources/test-resources"
import {setSubcaccCertEnvVar} from "../../resources/test-helpers"
import {verifyPrescriptionSignature} from "../../../src/services/verification/signature-verification"
import {
  extractSignatureRootFromParentPrescription,
  extractSignatureDateTimeStamp
} from "../../../src/services/verification/common"
import {clone} from "../../resources/test-helpers"
import {hl7V3} from "@models"
import pino from "pino"
import {X509Certificate} from "crypto"
import path from "path"
import fs from "fs"

const logger = pino()

describe("verifyPrescriptionSignature", () => {
  beforeAll(() => {
    process.env.SUBCACC_CERT = ""
    setSubcaccCertEnvVar("../resources/certificates/subCA-dummy.crt")
  })

  describe("Signature doesn't match prescription", () => {
    const validSignature = TestResources.parentPrescriptions.validSignature.ParentPrescription

    test("passes if prescription has digest that matches prescription", async () => {
      const result = await verifyPrescriptionSignature(validSignature, logger)
      console.log( "result ", result )

      expect(result).not.toContain("Signature doesn't match prescription")
    })

    // test("fails if prescription has digest that doesn't match prescription", async () => {
    //   const clonePrescription = clone(validSignature)
    //   const author = clonePrescription.pertinentInformation1.pertinentPrescription.author
    //   author.AgentPerson.agentPerson.name._text = "different"
    //   const result = await verifyPrescriptionSignature(clonePrescription, logger)
    //   expect(result).toContain("Signature doesn't match prescription")
    // })
  })

  // describe("Signature is invalid", () => {
  //   const validSignature = TestResources.parentPrescriptions.validSignature.ParentPrescription
  //   const valid256Signature = TestResources.parentPrescriptions.sha256Signature.ParentPrescription
  //
  //   test("passes if prescription has valid Signature that matches prescription", async () => {
  //     const result = await verifyPrescriptionSignature(validSignature, logger)
  //     expect(result).not.toContain("Signature is invalid")
  //   })
  //
  //   test("passes if prescription signature method algorithm that references SHA-256 matches prescription", async () => {
  //     const result = await verifyPrescriptionSignature(valid256Signature, logger)
  //     expect(result).not.toContain("Signature is invalid")
  //   }, 10000)
  //
  //   // test("passes if prescription signature is valid but method algorithm does not reference SHA-256 or SHA-1",
  //   //   async () => {
  //   //     const clonePrescription = clone(validSignature)
  //   //     const signatureRoot = extractSignatureRootFromParentPrescription(clonePrescription)
  //   //     signatureRoot.Signature.SignedInfo.SignatureMethod._attributes.Algorithm =
  //   //     "http://www.w3.org/2000/09/xmldsig#"
  //   //     signatureRoot.Signature.SignedInfo.Reference.DigestMethod._attributes.Algorithm =
  //   //     "http://www.w3.org/2000/09/xmldsig#"
  //   //     const result = await verifyPrescriptionSignature(clonePrescription, logger)
  //   //     expect(result).not.toContain("Signature is invalid")
  //   //   })
  //   //
  //   // test("fails if prescription signature is valid but method algorithm references incorrect encoding",
  //   //   async () => {
  //   //     const clonePrescription = clone(validSignature)
  //   //     const signatureRoot = extractSignatureRootFromParentPrescription(clonePrescription)
  //   //     signatureRoot.Signature.SignedInfo.SignatureMethod._attributes.Algorithm =
  //   //     "http://www.w3.org/2000/09/xmldsig#rsa-sha224"
  //   //     signatureRoot.Signature.SignedInfo.Reference.DigestMethod._attributes.Algorithm =
  //   //     "http://www.w3.org/2000/09/xmldsig#sha224"
  //   //     const result = await verifyPrescriptionSignature(clonePrescription, logger)
  //   //     expect(result).toContain("Signature is invalid")
  //   //   })
  // })
})

import { InteractionObject, Matchers } from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../resources/test-resources"
import { Bundle, Parameters, Provenance } from "../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import * as fetch from "node-fetch"
import * as XmlJs from "xml-js"

jestpact.pactWith(
  {
    spec: 3,
    consumer: `nhsd-apim-eps-test-client+${process.env.PACT_VERSION}`,
    provider: `nhsd-apim-eps+${process.env.PACT_VERSION}`,
    pactfileWriteMode: "overwrite"
  },
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("prepare e2e tests", () => {

      test.each(TestResources.prepareCases)("should be able to prepare a %s message", async (desc: string, inputMessage: Bundle, outputMessage: Parameters) => {
        const apiPath = "/$prepare"
        const inputMessageStr = LosslessJson.stringify(inputMessage)
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to prepare ${desc} message`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            method: "POST",
            path: "/$prepare",
            body: JSON.parse(inputMessageStr)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            body: outputMessage,
            status: 200
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .send(inputMessageStr)
          .expect(200)
      })
    })

    describe("process-message e2e tests", () => {

      test.each(TestResources.processCases)("should be able to process %s", async (desc: string, message: Bundle, prepareResponse: Parameters, convertResponse: XmlJs.ElementCompact) => {
        const apiPath = "/$process-message"
        const bundleStr = LosslessJson.stringify(message)
        const bundle = JSON.parse(bundleStr) as Bundle

        if (process.env.APIGEE_ENVIRONMENT && !process.env.APIGEE_ENVIRONMENT.includes("sandbox")) {

          // upload payload and display from matching prepare response to signing service, get token

          const signatureRequest = {
            "algorithm": prepareResponse.parameter[3].valueString,
            "payload": prepareResponse.parameter[0].valueString,
            "display": prepareResponse.parameter[2].valueString
          }

          const signatureRequestOptions: RequestInit = {
            method: 'POST',
            headers: [
              ["Authorization", `Bearer ${process.env.APIGEE_ACCESS_TOKEN}`],
              ["Content-Type", "application/json"]
            ],
            body: JSON.stringify(signatureRequest)
          }

          const signingServiceUrl = `https://${process.env.APIGEE_ENVIRONMENT}.api.service.nhs.uk/signing-service`

          const signatureResponse = await fetch(`${signingServiceUrl}/api/v1/SignatureRequest`, signatureRequestOptions)
          const signatureResponseJson = await signatureResponse.json()
          const token = signatureResponseJson.token

          // get uploaded payload from signing service using token and ignore (required to pass validation in signing service)

          const signatureRequestTokenOptions: RequestInit = {
            method: 'GET',
            headers: [
              ["Authorization", `Bearer ${process.env.APIGEE_ACCESS_TOKEN}`],
              ["Content-Type", "application/json"]
            ]
          }

          await fetch(`${signingServiceUrl}/api/v1/SignatureRequest/${token}`, signatureRequestTokenOptions)

          const convertResponseInteraction = convertResponse.PORX_IN020101SM31 ?? convertResponse.PORX_IN020101SM32

          if (!convertResponseInteraction) {
            return // todo: investigate why convert responses are missing for certain examples
          }

          // upload signature and certificate from matching pre-signed convert response example to signing service using token

          const signaturePostResponseOptions: RequestInit = {
            method: 'POST',
            headers: [
              ["Authorization", `Bearer ${process.env.APIGEE_ACCESS_TOKEN}`],
              ["Content-Type", "application/json"]
            ],
            body: JSON.stringify({
              "signature": convertResponseInteraction.ControlActEvent.subject.ParentPrescription.pertinentInformation1.pertinentPrescription.author.signatureText.Signature.SignatureValue._text,
              "certificate": convertResponseInteraction.ControlActEvent.subject.ParentPrescription.pertinentInformation1.pertinentPrescription.author.signatureText.Signature.KeyInfo.X509Data.X509Certificate._text
            })
          }

          await fetch(`${signingServiceUrl}/api/v1/SignatureResponse/${token}`, signaturePostResponseOptions)

          // get uploaded signature and certificate from signing service using token

          const signatureGetResponseOptions: RequestInit = {
            method: 'GET',
            headers: [
              ["Authorization", `Bearer ${process.env.APIGEE_ACCESS_TOKEN}`],
              ["Content-Type", "application/json"]
            ]
          }

          const signatureGetResponse = await fetch(`${signingServiceUrl}/api/v1/SignatureResponse/${token}`, signatureGetResponseOptions)
          const signatureGetResponseJson = await signatureGetResponse.json()

          // get values to replace in provenance xmldsig from signing service signature response

          const digest = Buffer.from(prepareResponse.parameter[1].valueString, "base64").toString() // todo: can get this from signing-service ??
          const regex = /(?<=<DigestValue>).*(?=<\/DigestValue>)/g
          const digestValue = digest.match(regex)[0]

          const signature = signatureGetResponseJson.signature
          const certificate = signatureGetResponseJson.certificate

          // update provenance xmldsig values from signing service

          bundle.entry.forEach(entry => {
            if (entry.resource.resourceType === "Provenance") {
              const provenance = entry.resource as Provenance
              let xmlDSig = Buffer.from(provenance.signature[0].data, "base64").toString()
              const provenanceDSig = xmlDSig.repeat(1)
              xmlDSig = xmlDSig.replace(/(?<=<DigestValue>).*(?=<\/DigestValue>)/g, digestValue)
              xmlDSig = xmlDSig.replace(/(?<=<SignatureValue>).*(?=<\/SignatureValue>)/g, signature)
              xmlDSig = xmlDSig.replace(/(?<=<X509Certificate>).*(?=<\/X509Certificate>)/g, certificate)
              expect(provenanceDSig).toBe(xmlDSig)
              provenance.signature[0].data = Buffer.from(xmlDSig).toString("base64")
            }
          })
        }

        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to process ${desc} message to Spine`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            method: "POST",
            path: "/$process-message",
            body: bundle
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            body: {
              resourceType: "OperationOutcome",
              issue: [
                {
                  code: "invalid",
                  severity: "error",
                  diagnostics: Matchers.term({ 
                    generate: "<?xml version='1.0' encoding='UTF-8'?>\n<SOAP-ENV:Envelope xmlns:crs=\"http://national.carerecords.nhs.uk/schema/crs/\" xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:wsa=\"http://schemas.xmlsoap.org/ws/2004/08/addressing\" xmlns=\"urn:hl7-org:v3\" xmlns:hl7=\"urn:hl7-org:v3\"><SOAP-ENV:Header><wsa:MessageID>uuid:EE8818C0-27EB-11EB-8872-000C29F50CF9</wsa:MessageID><wsa:Action>urn:nhs:names:services:mm/MCCI_IN010000UK13</wsa:Action><wsa:To/><wsa:From><wsa:Address>https://mm.national.ncrs.nhs.uk/syncservice</wsa:Address></wsa:From><communicationFunctionRcv typeCode=\"RCV\"><device classCode=\"DEV\" determinerCode=\"INSTANCE\"><id root=\"1.2.826.0.1285.0.2.0.107\" extension=\"200000001285\"/></device></communicationFunctionRcv><communicationFunctionSnd typeCode=\"SND\"><device classCode=\"DEV\" determinerCode=\"INSTANCE\"><id root=\"1.2.826.0.1285.0.2.0.107\" extension=\"None\"/></device></communicationFunctionSnd><wsa:RelatesTo>uuid:59414133-6E0F-4AD7-A9B0-6EB4893226D6</wsa:RelatesTo></SOAP-ENV:Header><SOAP-ENV:Body><PrescriptionsResponse><MCCI_IN010000UK13><id root=\"EE8818C0-27EB-11EB-8872-000C29F50CF9\"/><creationTime value=\"20201116091303\"/><versionCode code=\"1\"/><interactionId root=\"2.16.840.1.113883.2.1.3.2.4.12\" extension=\"MCCI_IN010000UK13\"/><processingCode code=\"P\"/><processingModeCode code=\"T\"/><acceptAckCode code=\"NE\"/><acknowledgement typeCode=\"AR\"><acknowledgementDetail typeCode=\"ER\"><code codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.32\" code=\"202\" displayName=\"Duplicate HL7 ID Error\"/></acknowledgementDetail><messageRef><id root=\"59414133-6E0F-4AD7-A9B0-6EB4893226D6\"/></messageRef></acknowledgement><communicationFunctionRcv typeCode=\"RCV\"><device classCode=\"DEV\" determinerCode=\"INSTANCE\"><id root=\"1.2.826.0.1285.0.2.0.107\" extension=\"200000001285\"/></device></communicationFunctionRcv><communicationFunctionSnd typeCode=\"SND\"><device classCode=\"DEV\" determinerCode=\"INSTANCE\"><id root=\"1.2.826.0.1285.0.2.0.107\" extension=\"None\"/></device></communicationFunctionSnd><ControlActEvent classCode=\"CACT\" moodCode=\"EVN\"><author1 typeCode=\"AUT\"><AgentSystemSDS classCode=\"AGNT\"><agentSystemSDS classCode=\"DEV\" determinerCode=\"INSTANCE\"><id root=\"1.2.826.0.1285.0.2.0.107\" extension=\"None\"/></agentSystemSDS></AgentSystemSDS></author1></ControlActEvent></MCCI_IN010000UK13></PrescriptionsResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>",
                    matcher: "acknowledgement typeCode=\\\"AR\\\""
                  })
                }
              ]
            },
            status: 400
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .send(bundleStr)
          .expect(400)
      })
    })
  }
)

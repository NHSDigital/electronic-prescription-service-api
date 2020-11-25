import { InteractionObject } from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../resources/test-resources"
import { Bundle, Parameters } from "../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"

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
      it('should reject unauthorised requests', async () => {
        const apiPath = "/$prepare"
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to prepare a message`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "Authorization": "I am a bad access token"
            },
            method: "POST",
            path: "/$convert",
            body: {}
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/json"
            },
            body: {
              resourceType: "OperationOutcome",
              issue: [
                {
                  severity: "error",
                  code: "forbidden",
                  details: {
                    coding: [
                      {
                        system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
                        version: "1",
                        code: "ACCESS_DENIED",
                        display: "{faultstring}"
                      }
                    ]
                  }
                }
              ]
            },
            status: 401
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .set('Authorization', 'I am a bad access token')
          .send({})
          .expect(401)
      })

      test.each(TestResources.prepareCases)("should be able to prepare a %s message", async (desc: string, inputMessage: Bundle, outputMessage: Parameters) => {
        const apiPath = "/$prepare"
        const inputMessageStr = LosslessJson.stringify(inputMessage)
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to prepare ${desc} message`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "Authorization": `Bearer ${process.env.APIGEE_ACCESS_TOKEN}`
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
          .set('Authorization', `Bearer ${process.env.APIGEE_ACCESS_TOKEN}`)
          .send(inputMessageStr)
          .expect(200)
      })
    })

    describe("process-message e2e tests", () => {
      it('should reject unauthorised requests', async () => {
        const apiPath = "/$process-message"
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to process a message to Spine`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "Authorization": "I am a bad access token"
            },
            method: "POST",
            path: "/$convert",
            body: {}
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/json"
            },
            body: {
              resourceType: "OperationOutcome",
              issue: [
                {
                  severity: "error",
                  code: "forbidden",
                  details: {
                    coding: [
                      {
                        system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
                        version: "1",
                        code: "ACCESS_DENIED",
                        display: "{faultstring}"
                      }
                    ]
                  }
                }
              ]
            },
            status: 401
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .send({})
          .expect(401)
      })

      test.each(TestResources.processCases)("should be able to process %s", async (desc: string, message: Bundle) => {
        const apiPath = "/$process-message"
        const bundleStr = LosslessJson.stringify(message)
        const bundle = JSON.parse(bundleStr) as Bundle

        /**
         * Don't think we need any of this
         */
        /*if (process.env.APIGEE_ENVIRONMENT && !process.env.APIGEE_ENVIRONMENT.includes("sandbox")) {

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
        }*/

        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to process ${desc} message to Spine`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "Authorization": `Bearer ${process.env.APIGEE_ACCESS_TOKEN}`
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
                  severity: "error"
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
          .set('Authorization', `Bearer ${process.env.APIGEE_ACCESS_TOKEN}`)
          .send(bundleStr)
          .expect(400)
      })
    })
  }
)

import {InteractionObject, Matchers} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as fs from 'fs'
import * as path from "path"

const prepareRepeatDispensingPrescriptionRequest = fs.readFileSync(path.join(__dirname, "../resources/example-1-repeat-dispensing/PrepareRequest-FhirMessageUnsigned.json"), "utf8")
const prepareRepeatDispensingPrescriptionResponse = fs.readFileSync(path.join(__dirname, "../resources/example-1-repeat-dispensing/PrepareResponse-FhirMessageDigest.json"), "utf8")
const sendRepeatDispensingPrescriptionRequest = fs.readFileSync(path.join(__dirname, "../resources/example-1-repeat-dispensing/SendRequest-FhirMessageSigned.json"), "utf8")

jestpact.pactWith(
  {
    consumer: "nhsd-apim-eps-test-client",
    provider: "nhsd-apim-eps-sandbox",
    pactfileWriteMode: "overwrite"
  },
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("eps sandbox e2e tests", () => {

      test("should be able to convert a FHIR repeat-dispensing parent-prescription-1 into a HL7V3 Spine interaction", async () => {
        const apiPath = "/$convert"
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: "a request to convert a FHIR repeat-dispensing parent-prescription-1",
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "NHSD-Session-URID": "1234"
            },
            method: "POST",
            path: "/$convert",
            body: JSON.parse(prepareRepeatDispensingPrescriptionRequest)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/xml"
            },
            status: 200
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .set('NHSD-Session-URID', '1234')
          .send(prepareRepeatDispensingPrescriptionRequest)
          .expect(200)
      })

      test("should be able to prepare a repeat-dispensing parent-prescription-1", async () => {
        const apiPath = "/$prepare"
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: "a request to prepare a repeat-dispensing parent-prescription-1",
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "NHSD-Session-URID": "1234"
            },
            method: "POST",
            path: "/$prepare",
            body: JSON.parse(prepareRepeatDispensingPrescriptionRequest)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            body: JSON.parse(prepareRepeatDispensingPrescriptionResponse),
            status: 200
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .set('NHSD-Session-URID', '1234')
          .send(prepareRepeatDispensingPrescriptionRequest)
          .expect(200)
      })

      test("should be able to send a repeat-dispensing parent-prescription-1", async () => {
        const apiPath = "/$process-message"
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: "a request to send a repeat-dispensing parent-prescription-1 to Spine",
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "NHSD-Session-URID": "1234"
            },
            method: "POST",
            path: "/$process-message",
            body: {
              resourceType: "OperationOutcome",
              issue: Matchers.eachLike({
                severity: Matchers.string("information"),
                code: Matchers.string("informational"),
                diagnostics: Matchers.string("Message Sent")
              })
            }
          },
          willRespondWith: {
            headers: {
              "Content-Location": Matchers.string("_poll/9807d292_074a_49e8_b48d_52e5bbf785ed")
            },
            status: 202
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .set('NHSD-Session-URID', '1234')
          .send(sendRepeatDispensingPrescriptionRequest)
          .expect(202)
      })

      test("should be able to poll for a prescription response", async () => {
        const apiPath = "/_poll/9807d292_074a_49e8_b48d_52e5bbf785ed"
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: "a request to poll for a prescription response",
          withRequest: {
            headers: {
              "Content-Type": "application/json",
              "NHSD-Session-URID": "1234"
            },
            method: "GET",
            path: apiPath
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            body: JSON.parse(sendRepeatDispensingPrescriptionRequest),
            status: 200
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .get(apiPath)
          .set('Content-Type', 'application/json')
          .set('NHSD-Session-URID', '1234')
          .expect(200)
      })
    })
  }
)

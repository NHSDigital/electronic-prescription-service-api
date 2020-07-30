import { InteractionObject, Matchers } from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as fs from 'fs'
import * as path from "path"

const prepareRepeatDispensingPrescriptionRequest = fs.readFileSync(path.join(__dirname, "../resources/example-1-repeat-dispensing/PrepareRequest-FhirMessageUnsigned.json"), "utf8")
const prepareRepeatDispensingPrescriptionResponse = fs.readFileSync(path.join(__dirname, "../resources/example-1-repeat-dispensing/PrepareResponse-FhirMessageDigest.json"), "utf8")
const sendRepeatDispensingPrescriptionSendRequest = fs.readFileSync(path.join(__dirname, "../resources/example-1-repeat-dispensing/SendRequest-FhirMessageSigned.json"), "utf8")

jestpact.pactWith(
  {
    consumer: "nhsd-apim-eps-test-client",
    provider: "nhsd-apim-eps",
    pactfileWriteMode: "overwrite"
  },
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("eps e2e tests", () => {

      test("should be able to convert a FHIR repeat-dispensing parent-prescription-1 into a HL7V3 Spine interaction", async () => {
        const apiPath = "/Convert"
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: "a request to convert a FHIR repeat-dispensing parent-prescription-1",
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "NHSD-Session-URID": "1234"
            },
            method: "POST",
            path: "/Convert",
            body: JSON.parse(prepareRepeatDispensingPrescriptionRequest)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
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
        const apiPath = "/Prepare"
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: "a request to prepare a repeat-dispensing parent-prescription-1",
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "NHSD-Session-URID": "1234"
            },
            method: "POST",
            path: "/Prepare",
            body: JSON.parse(prepareRepeatDispensingPrescriptionRequest)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            body: {
              resourceType: "Parameters",
              parameter: Matchers.eachLike({
                name: "message-digest",
                valueString: Matchers.term({ generate: JSON.parse(prepareRepeatDispensingPrescriptionResponse).parameter[0].valueString, matcher: "(DigestValue)" })
              })
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


      test("should be able to send a repeat-dispensing parent-prescription-1", async () => {
        const apiPath = "/Send"
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: "a request to send a repeat-dispensing parent-prescription-1 to Spine",
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "NHSD-Session-URID": "1234"
            },
            method: "POST",
            path: "/Send",
            body: JSON.parse(sendRepeatDispensingPrescriptionSendRequest)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            status: 200
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .set('NHSD-Session-URID', '1234')
          .send(sendRepeatDispensingPrescriptionSendRequest)
          .expect(200)
      })

    })
  }
)

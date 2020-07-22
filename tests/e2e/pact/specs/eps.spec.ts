import { InteractionObject, Matchers } from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as fs from 'fs'
import * as path from "path"

const prepareRepeatDispensingPrescriptionRequest = fs.readFileSync(path.join(__dirname, "../resources/example-1-repeat-dispensing/PrepareRequest-FhirMessageUnsigned.json"), "utf8")
const prepareRepeatDispensingPrescriptionResponse = fs.readFileSync(path.join(__dirname, "../resources/example-1-repeat-dispensing/PrepareResponse-FhirMessageDigest.json"), "utf8")

jestpact.pactWith(
  {
    consumer: "nhsd-apim-eps-test-client",
    provider: "nhsd-apim-eps",
    pactfileWriteMode: "overwrite"
  },
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`;
      return supertest(url);
    };

    describe("eps e2e tests", () => {

      test("should be able to convert a FHIR repeat-dispensing parent-prescription-1 into a HL7V3 Spine interaction", async () => {
        const apiPath = "/Convert";
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: "a request to convert a FHIR repeat-dispensing parent-prescription-1",
          withRequest: {
            headers: {
              "Content-Type": "application/json",
              "NHSD-Session-URID": "1234"
            },
            method: "POST",
            path: "/Convert",
            body: JSON.parse(prepareRepeatDispensingPrescriptionRequest)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/xml"
            },
            status: 200
          }
        };
        await provider.addInteraction(interaction);
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/json')
          .set('NHSD-Session-URID', '1234')
          .send(prepareRepeatDispensingPrescriptionRequest)
          .expect(200);
      });


      test("should be able to prepare a repeat-dispensing parent-prescription-1", async () => {
        const apiPath = "/Prepare";
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: "a request to prepare a repeat-dispensing parent-prescription-1",
          withRequest: {
            headers: {
              "Content-Type": "application/json",
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
        };
        await provider.addInteraction(interaction);
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/json')
          .set('NHSD-Session-URID', '1234')
          .send(prepareRepeatDispensingPrescriptionRequest)
          .expect(200);
      });
      

      test("should be able to send a repeat-dispensing parent-prescription-1", async () => {
        const apiPath = "/Send";
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: "a request to send a repeat-dispensing parent-prescription-1 to Spine",
          withRequest: {
            headers: {
              "Content-Type": "application/json",
              "NHSD-Session-URID": "1234"
            },
            method: "POST",
            path: "/Send",
            body: JSON.parse(prepareRepeatDispensingPrescriptionRequest)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/xml"
            },
            body: Matchers.term({ 
              generate: '<?xml version=\'1.0\' encoding=\'UTF-8\'?>\n<soap:Envelope xmlns:xsi="http://www.w3c.org/2001/XML-Schema-Instance" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:eb="http://www.oasis-open.org/committees/ebxml-msg/schema/msg-header-2_0.xsd" xmlns:hl7ebxml="urn:hl7-org:transport/ebXML/DSTUv1.0" xmlns:xlink="http://www.w3.org/1999/xlink"><soap:Header><eb:MessageHeader eb:version="2.0" soap:mustUnderstand="1"><eb:From><eb:PartyId eb:type="urn:nhs:names:partyType:ocs+serviceInstance">YES-0000806</eb:PartyId></eb:From><eb:To><eb:PartyId eb:type="urn:nhs:names:partyType:ocs+serviceInstance">T141D-822234</eb:PartyId></eb:To><eb:CPAId>S20001A000100</eb:CPAId><eb:ConversationId>8788691B-1A3A-450D-B40A-3C27B6B1BBFA</eb:ConversationId><eb:Service>urn:oasis:names:tc:ebxml-msg:service</eb:Service><eb:Action>Acknowledgment</eb:Action><eb:MessageData><eb:MessageId>F3D691FC-CC2F-11EA-AB61-000C29F50CF9</eb:MessageId><eb:Timestamp>2020-07-22T15: 28: 11Z</eb:Timestamp><eb:RefToMessageId>FBA91221-811F-48D4-A5D8-ABC1B41D950F</eb:RefToMessageId></eb:MessageData></eb:MessageHeader><eb:Acknowledgment eb:version="2.0" soap:mustUnderstand="1" soap:actor="urn:oasis:names:tc:ebxml-msg:actor:toPartyMSH"><eb:Timestamp>2020-07-22T15: 28: 11</eb:Timestamp><eb:RefToMessageId>FBA91221-811F-48D4-A5D8-ABC1B41D950F</eb:RefToMessageId><eb:From><eb:PartyId eb:type="urn:nhs:names:partyType:ocs+serviceInstance">YES-0000806</eb:PartyId></eb:From></eb:Acknowledgment></soap:Header><soap:Body/></soap:Envelope>',
              matcher: "(Acknowledgment)"
            }),
            status: 202
          }
        };
        await provider.addInteraction(interaction);
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/json')
          .set('NHSD-Session-URID', '1234')
          .send(prepareRepeatDispensingPrescriptionRequest)
          .expect(202);
      });

    });
  }
);
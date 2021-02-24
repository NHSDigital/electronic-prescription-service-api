import {SpineClient} from "."
import {SpineRequest, SpineResponse} from "../../models/spine"
import * as hl7V3 from "../../models/hl7-v3"
import * as fhir from "../../models/fhir"

export class SandboxSpineClient implements SpineClient {
  async send(spineRequest: SpineRequest): Promise<SpineResponse<unknown>> {
    switch (spineRequest.interactionId) {
      case hl7V3.Hl7InteractionIdentifier.PARENT_PRESCRIPTION_URGENT._attributes.extension:
        return Promise.resolve({
          statusCode: 200,
          // eslint-disable-next-line max-len
          body: "----=_MIME-Boundary\r\nContent-Id: <ebXMLHeader@spine.nhs.uk>\r\nContent-Type: text/xml\r\nContent-Transfer-Encoding: 8bit\r\n\r\n<?xml version='1.0' encoding='UTF-8'?>\n<soap:Envelope xmlns:xsi=\"http://www.w3c.org/2001/XML-Schema-Instance\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:eb=\"http://www.oasis-open.org/committees/ebxml-msg/schema/msg-header-2_0.xsd\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"><soap:Header><eb:MessageHeader eb:version=\"2.0\" soap:mustUnderstand=\"1\"><eb:From><eb:PartyId eb:type=\"urn:nhs:names:partyType:ocs+serviceInstance\">YES-0000806</eb:PartyId></eb:From><eb:To><eb:PartyId eb:type=\"urn:nhs:names:partyType:ocs+serviceInstance\">T141D-822234</eb:PartyId></eb:To><eb:CPAId>S20001A000100</eb:CPAId><eb:ConversationId>69BF9F53-EFC1-4874-8E87-90CA7448373A</eb:ConversationId><eb:Service>urn:nhs:names:services:mm</eb:Service><eb:Action>MCCI_IN010000UK13</eb:Action><eb:MessageData><eb:MessageId>A7B86F8D-1DBD-FC28-E050-D20AE3AFFFFF</eb:MessageId><eb:Timestamp>2020-09-21T14:14:46Z</eb:Timestamp><eb:RefToMessageId>6B2192E2-D069-4FB7-A086-C1328D2B54AE</eb:RefToMessageId></eb:MessageData><eb:DuplicateElimination/></eb:MessageHeader><eb:AckRequested eb:version=\"2.0\" soap:mustUnderstand=\"1\" soap:actor=\"urn:oasis:names:tc:ebxml-msg:actor:toPartyMSH\" eb:signed=\"false\"/><eb:SyncReply eb:version=\"2.0\" soap:mustUnderstand=\"1\" soap:actor=\"http://schemas.xmlsoap.org/soap/actor/next\"/></soap:Header><soap:Body><eb:Manifest xmlns:hl7ebxml=\"urn:hl7-org:transport/ebXML/DSTUv1.0\" eb:version=\"2.0\"><eb:Reference xlink:href=\"cid:A7B86F8D-1DBD-FC28-E050-D20AE3AFFFFF@spine.nhs.uk\"><eb:Schema eb:location=\"urn:hl7-org:v3_MCCI_IN010000UK13.xsd\" eb:version=\"13\"/><eb:Description xml:lang=\"en\">The HL7 payload</eb:Description><hl7ebxml:Payload style=\"HL7\" encoding=\"XML\" version=\"3.0\"/></eb:Reference></eb:Manifest></soap:Body></soap:Envelope>\r\n\r\n----=_MIME-Boundary\r\nContent-Id: <A7B86F8D-1DBD-FC28-E050-D20AE3AFFFFF@spine.nhs.uk>\r\nContent-Type: application/xml\r\nContent-Transfer-Encoding: 8bit\r\n\r\n<?xml version='1.0' encoding='UTF-8'?>\n<hl7:MCCI_IN010000UK13 xmlns:hl7=\"urn:hl7-org:v3\"><hl7:id root=\"A7B86F8D-1DBD-FC28-E050-D20AE3AFFFFF\"/><hl7:creationTime value=\"20200921141446\"/><hl7:versionCode code=\"V3NPfIT4.2.00\"/><hl7:interactionId root=\"2.16.840.1.113883.2.1.3.2.4.12\" extension=\"MCCI_IN010000UK13\"/><hl7:processingCode code=\"P\"/><hl7:processingModeCode code=\"T\"/><hl7:acceptAckCode code=\"NE\"/><hl7:acknowledgement typeCode=\"AA\"><hl7:messageRef><hl7:id root=\"A7B86F8D-1DBD-FC28-E050-D20AE3AFFFFF\"/></hl7:messageRef></hl7:acknowledgement><hl7:communicationFunctionRcv typeCode=\"RCV\"><hl7:device classCode=\"DEV\" determinerCode=\"INSTANCE\"><hl7:id root=\"1.2.826.0.1285.0.2.0.107\" extension=\"200000001285\"/></hl7:device></hl7:communicationFunctionRcv><hl7:communicationFunctionSnd typeCode=\"SND\"><hl7:device classCode=\"DEV\" determinerCode=\"INSTANCE\"><hl7:id root=\"1.2.826.0.1285.0.2.0.107\" extension=\"567456789789\"/></hl7:device></hl7:communicationFunctionSnd><hl7:ControlActEvent classCode=\"CACT\" moodCode=\"EVN\"><hl7:author1 typeCode=\"AUT\"><hl7:AgentSystemSDS classCode=\"AGNT\"><hl7:agentSystemSDS classCode=\"DEV\" determinerCode=\"INSTANCE\"><hl7:id root=\"1.2.826.0.1285.0.2.0.107\" extension=\"567456789789\"/></hl7:agentSystemSDS></hl7:AgentSystemSDS></hl7:author1></hl7:ControlActEvent></hl7:MCCI_IN010000UK13>\r\n----=_MIME-Boundary--"
        })
      case hl7V3.Hl7InteractionIdentifier.CANCEL_REQUEST._attributes.extension:
        return Promise.resolve({
          statusCode: 200,
          // eslint-disable-next-line max-len
          body: "----=_MIME-Boundary\r\nContent-Id: <ebXMLHeader@spine.nhs.uk>\r\nContent-Type: text/xml\r\nContent-Transfer-Encoding: 8bit\r\n\r\n<?xml version='1.0' encoding='UTF-8'?>\n<soap:Envelope xmlns:xsi=\"http://www.w3c.org/2001/XML-Schema-Instance\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:eb=\"http://www.oasis-open.org/committees/ebxml-msg/schema/msg-header-2_0.xsd\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"><soap:Header><eb:MessageHeader eb:version=\"2.0\" soap:mustUnderstand=\"1\"><eb:From><eb:PartyId eb:type=\"urn:nhs:names:partyType:ocs+serviceInstance\">YES-0000806</eb:PartyId></eb:From><eb:To><eb:PartyId eb:type=\"urn:nhs:names:partyType:ocs+serviceInstance\">T141D-822234</eb:PartyId></eb:To><eb:CPAId>S20001A000100</eb:CPAId><eb:ConversationId>69BF9F53-EFC1-4874-8E87-90CA7448373A</eb:ConversationId><eb:Service>urn:nhs:names:services:mm</eb:Service><eb:Action>PORX_IN050101UK31</eb:Action><eb:MessageData><eb:MessageId>A7B86F8D-1DBD-FC28-E050-D20AE3AFFFFF</eb:MessageId><eb:Timestamp>2020-09-21T14:14:46Z</eb:Timestamp><eb:RefToMessageId>6B2192E2-D069-4FB7-A086-C1328D2B54AE</eb:RefToMessageId></eb:MessageData><eb:DuplicateElimination/></eb:MessageHeader><eb:AckRequested eb:version=\"2.0\" soap:mustUnderstand=\"1\" soap:actor=\"urn:oasis:names:tc:ebxml-msg:actor:toPartyMSH\" eb:signed=\"false\"/><eb:SyncReply eb:version=\"2.0\" soap:mustUnderstand=\"1\" soap:actor=\"http://schemas.xmlsoap.org/soap/actor/next\"/></soap:Header><soap:Body><eb:Manifest xmlns:hl7ebxml=\"urn:hl7-org:transport/ebXML/DSTUv1.0\" eb:version=\"2.0\"><eb:Reference xlink:href=\"cid:A7B86F8D-1DBD-FC28-E050-D20AE3AFFFFF@spine.nhs.uk\"><eb:Schema eb:location=\"urn:hl7-org:v3_PORX_IN050101UK31.xsd\" eb:version=\"13\"/><eb:Description xml:lang=\"en\">The HL7 payload</eb:Description><hl7ebxml:Payload style=\"HL7\" encoding=\"XML\" version=\"3.0\"/></eb:Reference></eb:Manifest></soap:Body></soap:Envelope>\r\n\r\n----=_MIME-Boundary\r\nContent-Id: <A7B86F8D-1DBD-FC28-E050-D20AE3AFFFFF@spine.nhs.uk>\r\nContent-Type: application/xml\r\nContent-Transfer-Encoding: 8bit\r\n\r\n<?xml version=\"1.0\" encoding=\"UTF-8\"?><hl7:PORX_IN050101UK31 xmlns:hl7=\"urn:hl7-org:v3\"><hl7:id root=\"8E8DE882-C367-204F-ECC6-59339FAA01BD\"/><hl7:creationTime value=\"20131209180449\"/><hl7:versionCode code=\"V3NPfIT3.0\"/><hl7:interactionId root=\"2.16.840.1.113883.2.1.3.2.4.12\" extension=\"PORX_IN050101UK31\"/><hl7:processingCode code=\"P\"/><hl7:processingModeCode code=\"T\"/><hl7:acceptAckCode code=\"NE\"/><hl7:acknowledgement typeCode=\"AA\"><hl7:messageRef><hl7:id root=\"EBAF6BD3-C349-3010-E040-950AE0731F3B\"/></hl7:messageRef></hl7:acknowledgement><hl7:communicationFunctionRcv typeCode=\"RCV\"><hl7:device classCode=\"DEV\" determinerCode=\"INSTANCE\"><hl7:id root=\"1.2.826.0.1285.0.2.0.107\" extension=\"460947724510\"/></hl7:device></hl7:communicationFunctionRcv><hl7:communicationFunctionSnd typeCode=\"SND\"><hl7:device classCode=\"DEV\" determinerCode=\"INSTANCE\"><hl7:id root=\"1.2.826.0.1285.0.2.0.107\" extension=\"428081423512\"/></hl7:device></hl7:communicationFunctionSnd><hl7:ControlActEvent classCode=\"CACT\" moodCode=\"EVN\"><hl7:author1 typeCode=\"AUT\"><hl7:AgentSystemSDS classCode=\"AGNT\"><hl7:agentSystemSDS classCode=\"DEV\" determinerCode=\"INSTANCE\"><hl7:id root=\"1.2.826.0.1285.0.2.0.107\" extension=\"ETP\"/></hl7:agentSystemSDS></hl7:AgentSystemSDS></hl7:author1><hl7:subject typeCode=\"SUBJ\" contextConductionInd=\"false\"><CancellationResponse classCode=\"INFRM\" moodCode=\"EVN\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:ppdbatch=\"http://spine.nhs.uk/spine-service-ppd\" xmlns:fn=\"http://www.w3.org/2005/02/xpath-functions\" xmlns:eb=\"http://www.oasis-open.org/committees/ebxml-msg/schema/msg-header-2_0.xsd\" xmlns:soapcsf=\"http://www.w3.org/2001/12/soap-envelope\" xmlns=\"urn:hl7-org:v3\" xmlns:nasp=\"http://spine.nhs.uk/spine-servicev1.0\" xmlns:soap=\"http://www.w3.org/2001/12/soap-envelope\"><id root=\"444309A2-81D9-85AE-4925-282C40D2F1D6\"/><effectiveTime value=\"20131209180449\"/><recordTarget typeCode=\"RCT\"><Patient classCode=\"PAT\"><id root=\"2.16.840.1.113883.2.1.4.1\" extension=\"9446362768\"/><addr use=\"H\"><streetAddressLine>41 BIRKDALE ROAD</streetAddressLine><streetAddressLine>STOCKTON-ON-TEES</streetAddressLine><streetAddressLine>CLEVELAND</streetAddressLine><postalCode>TS18 5JJ</postalCode><addressKey/><desc/></addr><patientPerson classCode=\"PSN\" determinerCode=\"INSTANCE\"><name use=\"L\"><prefix>MR</prefix><given>HORATIO</given><given>THEOBALD</given><family>FAZAL</family><suffix/></name><administrativeGenderCode code=\"0\"/><birthTime value=\"19850828\"/><playedProviderPatient classCode=\"PAT\"><subjectOf typeCode=\"SBJ\"><patientCareProvision classCode=\"PCPR\" moodCode=\"EVN\"><code codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.37\" code=\"1\"/><responsibleParty typeCode=\"RESP\"><healthCareProvider classCode=\"PROV\"><id root=\"1.2.826.0.1285.0.2.0.65\" extension=\"C81007\"/></healthCareProvider></responsibleParty></patientCareProvision></subjectOf></playedProviderPatient></patientPerson></Patient></recordTarget><author typeCode=\"AUT\"><AgentPerson classCode=\"AGNT\"><id root=\"1.2.826.0.1285.0.2.0.67\" extension=\"100102042981\"/><code codeSystem=\"1.2.826.0.1285.0.2.1.104\" code=\"R0260\"/><telecom use=\"WP\" value=\"tel:01332332812\"/><agentPerson classCode=\"PSN\" determinerCode=\"INSTANCE\"><id root=\"1.2.826.0.1285.0.2.0.65\" extension=\"3410772\"/><name use=\"L\">BHOWMIK</name></agentPerson><representedOrganization classCode=\"ORG\" determinerCode=\"INSTANCE\"><id root=\"1.2.826.0.1285.0.1.10\" extension=\"C81007\"/><code codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.94\" code=\"001\"/><name>VERNON STREET MEDICAL CTR</name><telecom use=\"WP\" value=\"tel:01332332812\"/><addr use=\"WP\"><streetAddressLine>13 VERNON STREET</streetAddressLine><streetAddressLine>DERBY</streetAddressLine><streetAddressLine>DERBYSHIRE</streetAddressLine><postalCode>DE1 1FW</postalCode></addr><healthCareProviderLicense classCode=\"PROV\"><Organization classCode=\"ORG\" determinerCode=\"INSTANCE\"><id root=\"1.2.826.0.1285.0.1.10\" extension=\"5EX\"/><code codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.94\" code=\"005\"/></Organization></healthCareProviderLicense></representedOrganization></AgentPerson></author><responsibleParty typeCode=\"RESP\"><AgentPerson classCode=\"AGNT\"><id root=\"1.2.826.0.1285.0.2.0.67\" extension=\"100102042981\"/><code codeSystem=\"1.2.826.0.1285.0.2.1.104\" code=\"R0260\"/><telecom use=\"WP\" value=\"tel:01332332812\"/><agentPerson classCode=\"PSN\" determinerCode=\"INSTANCE\"><id root=\"1.2.826.0.1285.0.2.0.65\" extension=\"G34107\"/><name use=\"L\">BHOWMIK</name></agentPerson><representedOrganization classCode=\"ORG\" determinerCode=\"INSTANCE\"><id root=\"1.2.826.0.1285.0.1.10\" extension=\"C81007\"/><code codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.94\" code=\"001\"/><name>VERNON STREET MEDICAL CTR</name><telecom use=\"WP\" value=\"tel:01332332812\"/><addr use=\"WP\"><streetAddressLine>13 VERNON STREET</streetAddressLine><streetAddressLine>DERBY</streetAddressLine><streetAddressLine>DERBYSHIRE</streetAddressLine><postalCode>DE1 1FW</postalCode></addr></representedOrganization></AgentPerson></responsibleParty><pertinentInformation2 typeCode=\"PERT\" contextConductionInd=\"true\"><seperatableInd value=\"false\"/><pertinentPrescriptionID classCode=\"OBS\" moodCode=\"EVN\"><code codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.30\" code=\"PID\"/><value root=\"2.16.840.1.113883.2.1.3.2.4.18.8\" extension=\"396F33-C81007-5C8DD9\"/></pertinentPrescriptionID></pertinentInformation2><pertinentInformation1 typeCode=\"PERT\" inversionInd=\"false\" negationInd=\"false\"><seperatableInd value=\"false\"/><pertinentLineItemRef classCode=\"SBADM\" moodCode=\"RQO\"><id root=\"EBAF4A14-315C-322C-E040-950AE0731B49\"/></pertinentLineItemRef></pertinentInformation1><pertinentInformation3 typeCode=\"PERT\" contextConductionInd=\"true\"><seperatableInd value=\"false\"/><pertinentResponse classCode=\"OBS\" moodCode=\"EVN\"><code code=\"CRR\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.30\"/><value codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.19\" code=\"0001\" displayName=\"Prescription/item was cancelled\"/></pertinentResponse></pertinentInformation3><pertinentInformation4 typeCode=\"PERT\" inversionInd=\"false\" negationInd=\"false\"><seperatableInd value=\"true\"/><pertinentCancellationRequestRef classCode=\"ACTN\" moodCode=\"RQO\"><id root=\"EBAF6BD3-C349-3010-E040-950AE0731F3B\"/></pertinentCancellationRequestRef></pertinentInformation4></CancellationResponse></hl7:subject></hl7:ControlActEvent></hl7:PORX_IN050101UK31>\r\n----=_MIME-Boundary--"
        })
      case hl7V3.Hl7InteractionIdentifier.NOMINATED_PRESCRIPTION_RELEASE_REQUEST._attributes.extension:
        return Promise.resolve({
          statusCode: 200,
          // eslint-disable-next-line max-len
          body: sandboxReleaseResponse
        })
      default:
        return Promise.resolve({
          statusCode: 400,
          body: notSupporedOperationOutcome
        })
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async poll(path: string): Promise<SpineResponse<fhir.OperationOutcome>> {
    return Promise.resolve({
      statusCode: 400,
      body: notSupporedOperationOutcome
    })
  }
}

const notSupporedOperationOutcome: fhir.OperationOutcome = {
  resourceType: "OperationOutcome",
  issue: [
    {
      code: "informational",
      severity: "information",
      details: {
        coding: [
          {
            code: "INTERACTION_NOT_SUPPORTED_BY_SANDBOX",
            display: "Interaction not supported by sandbox",
            system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
            version: "1"
          }
        ]
      }
    }
  ]
}

const bundle1Id = "eff31db2-a914-44a9-b89d-1a33f6de727e"
const genericBundle1: fhir.Bundle = {
  resourceType: "Bundle",
  type: "message",
  id: bundle1Id,
  identifier: {
    value: bundle1Id
  }
}

const bundle2Id = "f6f2fd4a-0f5a-4cee-82a0-e6d08d64c2b4"
const genericBundle2: fhir.Bundle = {
  resourceType: "Bundle",
  type: "message",
  id: bundle2Id,
  identifier: {
    value: bundle2Id
  }
}
const messageId = "d5a20db9-6d76-4aeb-a190-9a85843b01bf"
const sandboxReleaseResponse ={
  resourceType: "Bundle",
  type: "searchset",
  total: 2,
  id: messageId,
  identifier: {
    value: messageId
  },
  entry: [
    {resource: genericBundle1, fullUrl: `urn:uuid:${bundle1Id}`},
    {resource: genericBundle2, fullUrl: `urn:uuid:${bundle2Id}`}
  ]
}

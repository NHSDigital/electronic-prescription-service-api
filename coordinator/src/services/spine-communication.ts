import axios, {AxiosError, AxiosResponse} from "axios"
import https from "https"
import {addEbXmlWrapper} from "./request-builder"
import {Hl7InteractionIdentifier} from "../model/hl7-v3-datatypes-codes"
import {OperationOutcome} from "../model/fhir-resources"

const SPINE_ENDPOINT = process.env.SPINE_ENV === "INT" ? process.env.INT_SPINE_URL : process.env.TEST_SPINE_URL
const SPINE_PATH = "/Prescription"
const SPINE_URL_SCHEME = "https"

export interface SpineRequest {
  message: string
  interactionId: string
}

type SpineResponse<T> = SpineDirectResponse<T> | SpinePollableResponse

export interface SpineDirectResponse<T> {
  body: T
  statusCode: number
}

export interface SpinePollableResponse {
  pollingUrl: string
  statusCode: number
}

export function isDirect<T>(spineResponse: SpineResponse<T>): spineResponse is SpineDirectResponse<T> {
  return !isPollable(spineResponse)
}

export function isPollable<T>(spineResponse: SpineResponse<T>): spineResponse is SpinePollableResponse {
  return "pollingUrl" in spineResponse
}

const httpsAgent = new https.Agent({
  cert: process.env.CLIENT_CERT,
  key: process.env.CLIENT_KEY,
  ca: [
    process.env.ROOT_CA_CERT,
    process.env.SUB_CA_CERT
  ]
})

export interface RequestHandler {
  send(spineRequest: SpineRequest): Promise<SpineResponse<unknown>>
  poll(path: string): Promise<SpineResponse<unknown>>
}

export class SandboxRequestHandler implements RequestHandler {
  parentPrescriptionPollingId = "9807d292_074a_49e8_b48d_52e5bbf785ed"
  cancellationPollingId = "a549d4d6_e6aa_4664_95f8_6c0cac17bd77"

  async send(spineRequest: SpineRequest): Promise<SpineResponse<string>> {
    if (spineRequest.interactionId === Hl7InteractionIdentifier.PARENT_PRESCRIPTION_URGENT._attributes.extension) {
      return Promise.resolve({
        pollingUrl: `_poll/${this.parentPrescriptionPollingId}`,
        statusCode: 202
      })
    } else if (spineRequest.interactionId === Hl7InteractionIdentifier.CANCEL_REQUEST._attributes.extension) {
      return Promise.resolve({
        pollingUrl: `_poll/${this.cancellationPollingId}`,
        statusCode: 202
      })
    } else {
      return Promise.resolve({
        body: "Interaction not supported by sandbox",
        statusCode: 400
      })
    }
  }

  async poll(path: string): Promise<SpineResponse<OperationOutcome>> {
    if (path === this.parentPrescriptionPollingId) {
      const parentPrescriptionOperationOutcome: OperationOutcome = {
        resourceType: "OperationOutcome",
        issue: [
          {
            code: "informational",
            severity: "information",
            // Once we start translating Spine responses we're going to replace this with a much shorter response anyway
            // eslint-disable-next-line max-len
            diagnostics: "----=_MIME-Boundary\r\nContent-Id: <ebXMLHeader@spine.nhs.uk>\r\nContent-Type: text/xml\r\nContent-Transfer-Encoding: 8bit\r\n\r\n<?xml version='1.0' encoding='UTF-8'?>\n<soap:Envelope xmlns:xsi=\"http://www.w3c.org/2001/XML-Schema-Instance\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:eb=\"http://www.oasis-open.org/committees/ebxml-msg/schema/msg-header-2_0.xsd\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"><soap:Header><eb:MessageHeader eb:version=\"2.0\" soap:mustUnderstand=\"1\"><eb:From><eb:PartyId eb:type=\"urn:nhs:names:partyType:ocs+serviceInstance\">YES-0000806</eb:PartyId></eb:From><eb:To><eb:PartyId eb:type=\"urn:nhs:names:partyType:ocs+serviceInstance\">T141D-822234</eb:PartyId></eb:To><eb:CPAId>S20001A000100</eb:CPAId><eb:ConversationId>69BF9F53-EFC1-4874-8E87-90CA7448373A</eb:ConversationId><eb:Service>urn:nhs:names:services:mm</eb:Service><eb:Action>MCCI_IN010000UK13</eb:Action><eb:MessageData><eb:MessageId>A7B86F8D-1DBD-FC28-E050-D20AE3AFFFFF</eb:MessageId><eb:Timestamp>2020-09-21T14:14:46Z</eb:Timestamp><eb:RefToMessageId>6B2192E2-D069-4FB7-A086-C1328D2B54AE</eb:RefToMessageId></eb:MessageData><eb:DuplicateElimination/></eb:MessageHeader><eb:AckRequested eb:version=\"2.0\" soap:mustUnderstand=\"1\" soap:actor=\"urn:oasis:names:tc:ebxml-msg:actor:toPartyMSH\" eb:signed=\"false\"/><eb:SyncReply eb:version=\"2.0\" soap:mustUnderstand=\"1\" soap:actor=\"http://schemas.xmlsoap.org/soap/actor/next\"/></soap:Header><soap:Body><eb:Manifest xmlns:hl7ebxml=\"urn:hl7-org:transport/ebXML/DSTUv1.0\" eb:version=\"2.0\"><eb:Reference xlink:href=\"cid:A7B86F8D-1DBD-FC28-E050-D20AE3AFFFFF@spine.nhs.uk\"><eb:Schema eb:location=\"urn:hl7-org:v3_MCCI_IN010000UK13.xsd\" eb:version=\"13\"/><eb:Description xml:lang=\"en\">The HL7 payload</eb:Description><hl7ebxml:Payload style=\"HL7\" encoding=\"XML\" version=\"3.0\"/></eb:Reference></eb:Manifest></soap:Body></soap:Envelope>\r\n\r\n----=_MIME-Boundary\r\nContent-Id: <A7B86F8D-1DBD-FC28-E050-D20AE3AFFFFF@spine.nhs.uk>\r\nContent-Type: application/xml\r\nContent-Transfer-Encoding: 8bit\r\n\r\n<?xml version='1.0' encoding='UTF-8'?>\n<hl7:MCCI_IN010000UK13 xmlns:hl7=\"urn:hl7-org:v3\"><hl7:id root=\"A7B86F8D-1DBD-FC28-E050-D20AE3AFFFFF\"/><hl7:creationTime value=\"20200921141446\"/><hl7:versionCode code=\"V3NPfIT4.2.00\"/><hl7:interactionId root=\"2.16.840.1.113883.2.1.3.2.4.12\" extension=\"MCCI_IN010000UK13\"/><hl7:processingCode code=\"P\"/><hl7:processingModeCode code=\"T\"/><hl7:acceptAckCode code=\"NE\"/><hl7:acknowledgement typeCode=\"AA\"><hl7:messageRef><hl7:id root=\"A7B86F8D-1DBD-FC28-E050-D20AE3AFFFFF\"/></hl7:messageRef></hl7:acknowledgement><hl7:communicationFunctionRcv typeCode=\"RCV\"><hl7:device classCode=\"DEV\" determinerCode=\"INSTANCE\"><hl7:id root=\"1.2.826.0.1285.0.2.0.107\" extension=\"200000001285\"/></hl7:device></hl7:communicationFunctionRcv><hl7:communicationFunctionSnd typeCode=\"SND\"><hl7:device classCode=\"DEV\" determinerCode=\"INSTANCE\"><hl7:id root=\"1.2.826.0.1285.0.2.0.107\" extension=\"567456789789\"/></hl7:device></hl7:communicationFunctionSnd><hl7:ControlActEvent classCode=\"CACT\" moodCode=\"EVN\"><hl7:author1 typeCode=\"AUT\"><hl7:AgentSystemSDS classCode=\"AGNT\"><hl7:agentSystemSDS classCode=\"DEV\" determinerCode=\"INSTANCE\"><hl7:id root=\"1.2.826.0.1285.0.2.0.107\" extension=\"567456789789\"/></hl7:agentSystemSDS></hl7:AgentSystemSDS></hl7:author1></hl7:ControlActEvent></hl7:MCCI_IN010000UK13>\r\n----=_MIME-Boundary--"
          }
        ]
      }
      return {
        statusCode: 200,
        body: parentPrescriptionOperationOutcome
      }
    } else if (path === this.cancellationPollingId) {
      const cancellationRequestOperationOutcome: OperationOutcome = {
        resourceType: "OperationOutcome",
        issue: [
          {
            code: "informational",
            severity: "information",
            // Once we start translating Spine responses we're going to replace this with a much shorter response anyway
            // eslint-disable-next-line max-len
            diagnostics: "----=_MIME-Boundary\r\nContent-Id: <ebXMLHeader@spine.nhs.uk>\r\nContent-Type: text/xml\r\nContent-Transfer-Encoding: 8bit\r\n\r\n<?xml version='1.0' encoding='UTF-8'?>\n<soap:Envelope xmlns:xsi=\"http://www.w3c.org/2001/XML-Schema-Instance\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:eb=\"http://www.oasis-open.org/committees/ebxml-msg/schema/msg-header-2_0.xsd\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"><soap:Header><eb:MessageHeader eb:version=\"2.0\" soap:mustUnderstand=\"1\"><eb:From><eb:PartyId eb:type=\"urn:nhs:names:partyType:ocs+serviceInstance\">YES-0000806</eb:PartyId></eb:From><eb:To><eb:PartyId eb:type=\"urn:nhs:names:partyType:ocs+serviceInstance\">T141D-822234</eb:PartyId></eb:To><eb:CPAId>S20001A000100</eb:CPAId><eb:ConversationId>69BF9F53-EFC1-4874-8E87-90CA7448373A</eb:ConversationId><eb:Service>urn:nhs:names:services:mm</eb:Service><eb:Action>PORX_IN050101UK31</eb:Action><eb:MessageData><eb:MessageId>A7B86F8D-1DBD-FC28-E050-D20AE3AFFFFF</eb:MessageId><eb:Timestamp>2020-09-21T14:14:46Z</eb:Timestamp><eb:RefToMessageId>6B2192E2-D069-4FB7-A086-C1328D2B54AE</eb:RefToMessageId></eb:MessageData><eb:DuplicateElimination/></eb:MessageHeader><eb:AckRequested eb:version=\"2.0\" soap:mustUnderstand=\"1\" soap:actor=\"urn:oasis:names:tc:ebxml-msg:actor:toPartyMSH\" eb:signed=\"false\"/><eb:SyncReply eb:version=\"2.0\" soap:mustUnderstand=\"1\" soap:actor=\"http://schemas.xmlsoap.org/soap/actor/next\"/></soap:Header><soap:Body><eb:Manifest xmlns:hl7ebxml=\"urn:hl7-org:transport/ebXML/DSTUv1.0\" eb:version=\"2.0\"><eb:Reference xlink:href=\"cid:A7B86F8D-1DBD-FC28-E050-D20AE3AFFFFF@spine.nhs.uk\"><eb:Schema eb:location=\"urn:hl7-org:v3_PORX_IN050101UK31.xsd\" eb:version=\"13\"/><eb:Description xml:lang=\"en\">The HL7 payload</eb:Description><hl7ebxml:Payload style=\"HL7\" encoding=\"XML\" version=\"3.0\"/></eb:Reference></eb:Manifest></soap:Body></soap:Envelope>\r\n\r\n----=_MIME-Boundary\r\nContent-Id: <A7B86F8D-1DBD-FC28-E050-D20AE3AFFFFF@spine.nhs.uk>\r\nContent-Type: application/xml\r\nContent-Transfer-Encoding: 8bit\r\n\r\n<?xml version=\"1.0\" encoding=\"UTF-8\"?><hl7:PORX_IN050101UK31 xmlns:hl7=\"urn:hl7-org:v3\"><hl7:id root=\"8E8DE882-C367-204F-ECC6-59339FAA01BD\"/><hl7:creationTime value=\"20131209180449\"/><hl7:versionCode code=\"V3NPfIT3.0\"/><hl7:interactionId root=\"2.16.840.1.113883.2.1.3.2.4.12\" extension=\"PORX_IN050101UK31\"/><hl7:processingCode code=\"P\"/><hl7:processingModeCode code=\"T\"/><hl7:acceptAckCode code=\"NE\"/><hl7:acknowledgement typeCode=\"AA\"><hl7:messageRef><hl7:id root=\"EBAF6BD3-C349-3010-E040-950AE0731F3B\"/></hl7:messageRef></hl7:acknowledgement><hl7:communicationFunctionRcv typeCode=\"RCV\"><hl7:device classCode=\"DEV\" determinerCode=\"INSTANCE\"><hl7:id root=\"1.2.826.0.1285.0.2.0.107\" extension=\"460947724510\"/></hl7:device></hl7:communicationFunctionRcv><hl7:communicationFunctionSnd typeCode=\"SND\"><hl7:device classCode=\"DEV\" determinerCode=\"INSTANCE\"><hl7:id root=\"1.2.826.0.1285.0.2.0.107\" extension=\"428081423512\"/></hl7:device></hl7:communicationFunctionSnd><hl7:ControlActEvent classCode=\"CACT\" moodCode=\"EVN\"><hl7:author1 typeCode=\"AUT\"><hl7:AgentSystemSDS classCode=\"AGNT\"><hl7:agentSystemSDS classCode=\"DEV\" determinerCode=\"INSTANCE\"><hl7:id root=\"1.2.826.0.1285.0.2.0.107\" extension=\"ETP\"/></hl7:agentSystemSDS></hl7:AgentSystemSDS></hl7:author1><hl7:subject typeCode=\"SUBJ\" contextConductionInd=\"false\"><CancellationResponse classCode=\"INFRM\" moodCode=\"EVN\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:ppdbatch=\"http://spine.nhs.uk/spine-service-ppd\" xmlns:fn=\"http://www.w3.org/2005/02/xpath-functions\" xmlns:eb=\"http://www.oasis-open.org/committees/ebxml-msg/schema/msg-header-2_0.xsd\" xmlns:soapcsf=\"http://www.w3.org/2001/12/soap-envelope\" xmlns=\"urn:hl7-org:v3\" xmlns:nasp=\"http://spine.nhs.uk/spine-servicev1.0\" xmlns:soap=\"http://www.w3.org/2001/12/soap-envelope\"><id root=\"444309A2-81D9-85AE-4925-282C40D2F1D6\"/><effectiveTime value=\"20131209180449\"/><recordTarget typeCode=\"RCT\"><Patient classCode=\"PAT\"><id root=\"2.16.840.1.113883.2.1.4.1\" extension=\"9446362768\"/><addr use=\"H\"><streetAddressLine>41 BIRKDALE ROAD</streetAddressLine><streetAddressLine>STOCKTON-ON-TEES</streetAddressLine><streetAddressLine>CLEVELAND</streetAddressLine><postalCode>TS18 5JJ</postalCode><addressKey/><desc/></addr><patientPerson classCode=\"PSN\" determinerCode=\"INSTANCE\"><name use=\"L\"><prefix>MR</prefix><given>HORATIO</given><given>THEOBALD</given><family>FAZAL</family><suffix/></name><administrativeGenderCode code=\"0\"/><birthTime value=\"19850828\"/><playedProviderPatient classCode=\"PAT\"><subjectOf typeCode=\"SBJ\"><patientCareProvision classCode=\"PCPR\" moodCode=\"EVN\"><code codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.37\" code=\"1\"/><responsibleParty typeCode=\"RESP\"><healthCareProvider classCode=\"PROV\"><id root=\"1.2.826.0.1285.0.2.0.65\" extension=\"C81007\"/></healthCareProvider></responsibleParty></patientCareProvision></subjectOf></playedProviderPatient></patientPerson></Patient></recordTarget><author typeCode=\"AUT\"><AgentPerson classCode=\"AGNT\"><id root=\"1.2.826.0.1285.0.2.0.67\" extension=\"100102042981\"/><code codeSystem=\"1.2.826.0.1285.0.2.1.104\" code=\"R0260\"/><telecom use=\"WP\" value=\"tel:01332332812\"/><agentPerson classCode=\"PSN\" determinerCode=\"INSTANCE\"><id root=\"1.2.826.0.1285.0.2.0.65\" extension=\"3410772\"/><name use=\"L\">BHOWMIK</name></agentPerson><representedOrganization classCode=\"ORG\" determinerCode=\"INSTANCE\"><id root=\"1.2.826.0.1285.0.1.10\" extension=\"C81007\"/><code codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.94\" code=\"001\"/><name>VERNON STREET MEDICAL CTR</name><telecom use=\"WP\" value=\"tel:01332332812\"/><addr use=\"WP\"><streetAddressLine>13 VERNON STREET</streetAddressLine><streetAddressLine>DERBY</streetAddressLine><streetAddressLine>DERBYSHIRE</streetAddressLine><postalCode>DE1 1FW</postalCode></addr><healthCareProviderLicense classCode=\"PROV\"><Organization classCode=\"ORG\" determinerCode=\"INSTANCE\"><id root=\"1.2.826.0.1285.0.1.10\" extension=\"5EX\"/><code codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.94\" code=\"005\"/></Organization></healthCareProviderLicense></representedOrganization></AgentPerson></author><responsibleParty typeCode=\"RESP\"><AgentPerson classCode=\"AGNT\"><id root=\"1.2.826.0.1285.0.2.0.67\" extension=\"100102042981\"/><code codeSystem=\"1.2.826.0.1285.0.2.1.104\" code=\"R0260\"/><telecom use=\"WP\" value=\"tel:01332332812\"/><agentPerson classCode=\"PSN\" determinerCode=\"INSTANCE\"><id root=\"1.2.826.0.1285.0.2.0.65\" extension=\"G34107\"/><name use=\"L\">BHOWMIK</name></agentPerson><representedOrganization classCode=\"ORG\" determinerCode=\"INSTANCE\"><id root=\"1.2.826.0.1285.0.1.10\" extension=\"C81007\"/><code codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.94\" code=\"001\"/><name>VERNON STREET MEDICAL CTR</name><telecom use=\"WP\" value=\"tel:01332332812\"/><addr use=\"WP\"><streetAddressLine>13 VERNON STREET</streetAddressLine><streetAddressLine>DERBY</streetAddressLine><streetAddressLine>DERBYSHIRE</streetAddressLine><postalCode>DE1 1FW</postalCode></addr></representedOrganization></AgentPerson></responsibleParty><pertinentInformation2 typeCode=\"PERT\" contextConductionInd=\"true\"><seperatableInd value=\"false\"/><pertinentPrescriptionID classCode=\"OBS\" moodCode=\"EVN\"><code codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.30\" code=\"PID\"/><value root=\"2.16.840.1.113883.2.1.3.2.4.18.8\" extension=\"396F33-C81007-5C8DD9\"/></pertinentPrescriptionID></pertinentInformation2><pertinentInformation1 typeCode=\"PERT\" inversionInd=\"false\" negationInd=\"false\"><seperatableInd value=\"false\"/><pertinentLineItemRef classCode=\"SBADM\" moodCode=\"RQO\"><id root=\"EBAF4A14-315C-322C-E040-950AE0731B49\"/></pertinentLineItemRef></pertinentInformation1><pertinentInformation3 typeCode=\"PERT\" contextConductionInd=\"true\"><seperatableInd value=\"false\"/><pertinentResponse classCode=\"OBS\" moodCode=\"EVN\"><code code=\"CRR\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.30\"/><value codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.19\" code=\"0001\" displayName=\"Prescription/item was cancelled\"/></pertinentResponse></pertinentInformation3><pertinentInformation4 typeCode=\"PERT\" inversionInd=\"false\" negationInd=\"false\"><seperatableInd value=\"true\"/><pertinentCancellationRequestRef classCode=\"ACTN\" moodCode=\"RQO\"><id root=\"EBAF6BD3-C349-3010-E040-950AE0731F3B\"/></pertinentCancellationRequestRef></pertinentInformation4></CancellationResponse></hl7:subject></hl7:ControlActEvent></hl7:PORX_IN050101UK31>\r\n----=_MIME-Boundary--"
          }
        ]
      }
      return {
        statusCode: 200,
        body: cancellationRequestOperationOutcome
      }
    } else {
      const notFoundOperationOutcome: OperationOutcome = {
        resourceType: "OperationOutcome",
        issue: [
          {
            code: "informational",
            severity: "information",
            details: {
              coding: [
                {
                  code: "POLLING_ID_NOT_FOUND",
                  display: "The polling id was not found",
                  system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
                  version: "1"
                }
              ]
            }
          }
        ]
      }
      return {
        statusCode: 404,
        body: notFoundOperationOutcome
      }
    }
  }
}

export class LiveRequestHandler implements RequestHandler {
  private readonly spineEndpoint: string
  private readonly spinePath: string
  private readonly ebXMLBuilder: (spineRequest: SpineRequest) => string

  constructor(spineEndpoint: string, spinePath: string, ebXMLBuilder: (spineRequest: SpineRequest) => string) {
    this.spineEndpoint = spineEndpoint
    this.spinePath = spinePath
    this.ebXMLBuilder = ebXMLBuilder
  }

  async send(spineRequest: SpineRequest): Promise<SpineResponse<unknown>> {
    const wrappedMessage = this.ebXMLBuilder(spineRequest)
    const address = `${SPINE_URL_SCHEME}://${this.spineEndpoint}${this.spinePath}`

    console.log(`Attempting to send the following message to ${address}:\n${wrappedMessage}`)

    try {
      const result = await axios.post<string>(
        address,
        wrappedMessage,
        {
          httpsAgent,
          headers: {
            "Content-Type": "multipart/related;" +
              " boundary=\"--=_MIME-Boundary\";" +
              " type=text/xml;" +
              " start=ebXMLHeader@spine.nhs.uk",
            "SOAPAction": `urn:nhs:names:services:mm/${spineRequest.interactionId}`
          }
        }
      )
      return LiveRequestHandler.handlePollableOrImmediateResponse(result)
    } catch (error) {
      console.log(`Failed post request for prescription message. Error: ${error}`)
      return LiveRequestHandler.handleError(error)
    }
  }

  async poll(path: string): Promise<SpineResponse<unknown>> {
    const address = `${SPINE_URL_SCHEME}://${this.spineEndpoint}/_poll/${path}`

    console.log(`Attempting to send polling message to ${address}`)

    try {
      const result = await axios.get<string>(
        address,
        {
          httpsAgent,
          headers: {"nhsd-asid": process.env.FROM_ASID}
        }
      )
      return LiveRequestHandler.handlePollableOrImmediateResponse(result)
    } catch (error) {
      console.log(`Failed polling request for polling path ${path}. Error: ${error}`)
      return LiveRequestHandler.handleError(error)
    }
  }

  private static handlePollableOrImmediateResponse(result: AxiosResponse) {
    switch (result.status) {
    case (200):
      console.log("Successful request, returning SpineDirectResponse")
      return {
        body: result.data,
        statusCode: result.status
      }
    case (202):
      console.log("Successful request, returning SpinePollableResponse")
      console.log(`Got polling URL ${result.headers["content-location"]}`)
      return {
        statusCode: result.status,
        pollingUrl: result.headers["content-location"]
      }
    default:
      console.log(`Got the following response from spine:\n${result.data}`)
      throw Error(`Unsupported status, expected 200 or 202, got ${result.status}`)
    }
  }

  private static handleError(error: Error): SpineResponse<unknown> {
    const axiosError = error as AxiosError
    if (axiosError.response) {
      return {
        body: axiosError.response.data,
        statusCode: axiosError.response.status
      }
    } else if (axiosError.request) {
      return {
        body: axiosError.request.data,
        statusCode: 408
      }
    } else {
      return {
        body: axiosError.message,
        statusCode: 500
      }
    }
  }
}

function createDefaultRequestHandler(): RequestHandler {
  if (process.env.SANDBOX === "1") {
    return new SandboxRequestHandler()
  } else {
    return new LiveRequestHandler(SPINE_ENDPOINT, SPINE_PATH, addEbXmlWrapper)
  }
}

export const defaultRequestHandler = createDefaultRequestHandler()

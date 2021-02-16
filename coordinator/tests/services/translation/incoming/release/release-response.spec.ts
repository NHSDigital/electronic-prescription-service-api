import {createBundleEntries} from "../../../../../src/services/translation/incoming/release/release-response"
import {readXml} from "../../../../../src/services/serialisation/xml"
import {ParentPrescription} from "../../../../../src/models/hl7-v3/hl7-v3-prescriptions"
import * as LosslessJson from "lossless-json"
import {
  parseAdditionalInstructionsText
} from "../../../../../src/services/translation/incoming/release/release-medication-request"

test("testing testing", () => {
  const result = createBundleEntries(getExample())
  console.log(LosslessJson.stringify(result))
})

function getExample() {
  const exampleObj = readXml(example)
  const resp = exampleObj["hl7:PORX_IN070101UK31"]["hl7:ControlActEvent"]["hl7:subject"]["PrescriptionReleaseResponse"]
  return resp["component"]["ParentPrescription"] as ParentPrescription
}

test("handles single patientInfo", () => {
  const thing = parseAdditionalInstructionsText(
    "<patientInfo>Patient info</patientInfo>"
  )
  expect(thing.medication).toEqual([])
  expect(thing.patientInfo).toEqual(["Patient info"])
  expect(thing.controlledDrugWords).toEqual("")
  expect(thing.additionalInstructions).toEqual("")
})

test("handles multiple patientInfo", () => {
  const thing = parseAdditionalInstructionsText(
    "<patientInfo>Patient info 1</patientInfo><patientInfo>Patient info 2</patientInfo>"
  )
  expect(thing.medication).toEqual([])
  expect(thing.patientInfo).toEqual(["Patient info 1", "Patient info 2"])
  expect(thing.controlledDrugWords).toEqual("")
  expect(thing.additionalInstructions).toEqual("")
})

test("handles single medication", () => {
  const thing = parseAdditionalInstructionsText(
    "<medication>Medication</medication>"
  )
  expect(thing.medication).toEqual(["Medication"])
  expect(thing.patientInfo).toEqual([])
  expect(thing.controlledDrugWords).toEqual("")
  expect(thing.additionalInstructions).toEqual("")
})

test("handles multiple medication", () => {
  const thing = parseAdditionalInstructionsText(
    "<medication>Medication 1</medication><medication>Medication 2</medication>"
  )
  expect(thing.medication).toEqual(["Medication 1", "Medication 2"])
  expect(thing.patientInfo).toEqual([])
  expect(thing.controlledDrugWords).toEqual("")
  expect(thing.additionalInstructions).toEqual("")
})

test("handles controlled drug words", () => {
  const thing = parseAdditionalInstructionsText(
    "CD: twenty eight"
  )
  expect(thing.medication).toEqual([])
  expect(thing.patientInfo).toEqual([])
  expect(thing.controlledDrugWords).toEqual("twenty eight")
  expect(thing.additionalInstructions).toEqual("")
})

test("handles additional instructions", () => {
  const thing = parseAdditionalInstructionsText(
    "Additional instructions"
  )
  expect(thing.medication).toEqual([])
  expect(thing.patientInfo).toEqual([])
  expect(thing.controlledDrugWords).toEqual("")
  expect(thing.additionalInstructions).toEqual("Additional instructions")
})

test("handles medication and patientInfo", () => {
  const thing = parseAdditionalInstructionsText(
    "<medication>Medication</medication><patientInfo>Patient info</patientInfo>"
  )
  expect(thing.medication).toEqual(["Medication"])
  expect(thing.patientInfo).toEqual(["Patient info"])
  expect(thing.controlledDrugWords).toEqual("")
  expect(thing.additionalInstructions).toEqual("")
})

test("handles controlled drug words and medication", () => {
  const thing = parseAdditionalInstructionsText(
    "<medication>Medication 1</medication>CD: twenty eight"
  )
  expect(thing.medication).toEqual(["Medication 1"])
  expect(thing.patientInfo).toEqual([])
  expect(thing.controlledDrugWords).toEqual("twenty eight")
  expect(thing.additionalInstructions).toEqual("")
})

test("handles controlled drug words and other instructions", () => {
  const thing = parseAdditionalInstructionsText(
    "CD: twenty eight\nAdditional instructions"
  )
  expect(thing.medication).toEqual([])
  expect(thing.patientInfo).toEqual([])
  expect(thing.controlledDrugWords).toEqual("twenty eight")
  expect(thing.additionalInstructions).toEqual("Additional instructions")
})

test("handles multiline additional instructions", () => {
  const thing = parseAdditionalInstructionsText(
    "Additional instructions line 1\nAdditional instructions line 2"
  )
  expect(thing.medication).toEqual([])
  expect(thing.patientInfo).toEqual([])
  expect(thing.controlledDrugWords).toEqual("")
  expect(thing.additionalInstructions).toEqual("Additional instructions line 1\nAdditional instructions line 2")
})

test("handles controlled drug words and multiline additional instructions", () => {
  const thing = parseAdditionalInstructionsText(
    "CD: twenty eight\nAdditional instructions line 1\nAdditional instructions line 2"
  )
  expect(thing.medication).toEqual([])
  expect(thing.patientInfo).toEqual([])
  expect(thing.controlledDrugWords).toEqual("twenty eight")
  expect(thing.additionalInstructions).toEqual("Additional instructions line 1\nAdditional instructions line 2")
})

test("handles all fields", () => {
  const thing = parseAdditionalInstructionsText(
    "<medication>Medication</medication><patientInfo>Patient info</patientInfo>CD: twenty eight\nInstructions"
  )
  expect(thing.medication).toEqual(["Medication"])
  expect(thing.patientInfo).toEqual(["Patient info"])
  expect(thing.controlledDrugWords).toEqual("twenty eight")
  expect(thing.additionalInstructions).toEqual("Instructions")
})

/* eslint-disable max-len */

const example = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><hl7:PORX_IN070101UK31 xmlns:hl7=\"urn:hl7-org:v3\">\n" +
  "<hl7:id root=\"672A7E8C-621F-71AF-45C1-BDF67023BA90\"/>\n" +
  "<hl7:creationTime value=\"20131210172737\"/>\n" +
  "<hl7:versionCode code=\"V3NPfIT3.0\"/>\n" +
  "<hl7:interactionId root=\"2.16.840.1.113883.2.1.3.2.4.12\" extension=\"PORX_IN070101UK31\"/>\n" +
  "<hl7:processingCode code=\"P\"/>\n" +
  "<hl7:processingModeCode code=\"T\"/>\n" +
  "<hl7:acceptAckCode code=\"NE\"/>\n" +
  "<hl7:acknowledgement typeCode=\"AA\">\n" +
  "<hl7:messageRef>\n" +
  "<hl7:id root=\"EBAF6BD3-C489-3010-E040-950AE0731F3B\"/>\n" +
  "</hl7:messageRef>\n" +
  "</hl7:acknowledgement>\n" +
  "<hl7:communicationFunctionRcv typeCode=\"RCV\">\n" +
  "<hl7:device classCode=\"DEV\" determinerCode=\"INSTANCE\">\n" +
  "<hl7:id root=\"1.2.826.0.1285.0.2.0.107\" extension=\"460947724510\"/>\n" +
  "</hl7:device>\n" +
  "</hl7:communicationFunctionRcv>\n" +
  "<hl7:communicationFunctionSnd typeCode=\"SND\">\n" +
  "<hl7:device classCode=\"DEV\" determinerCode=\"INSTANCE\">\n" +
  "<hl7:id root=\"1.2.826.0.1285.0.2.0.107\" extension=\"428081423512\"/>\n" +
  "</hl7:device>\n" +
  "</hl7:communicationFunctionSnd>\n" +
  "<hl7:ControlActEvent classCode=\"CACT\" moodCode=\"EVN\">\n" +
  "<hl7:author1 typeCode=\"AUT\">\n" +
  "<hl7:AgentSystemSDS classCode=\"AGNT\">\n" +
  "<hl7:agentSystemSDS classCode=\"DEV\" determinerCode=\"INSTANCE\">\n" +
  "<hl7:id root=\"1.2.826.0.1285.0.2.0.107\" extension=\"ETP\"/>\n" +
  "</hl7:agentSystemSDS>\n" +
  "</hl7:AgentSystemSDS>\n" +
  "</hl7:author1>\n" +
  "<hl7:subject typeCode=\"SUBJ\" contextConductionInd=\"false\">\n" +
  "<PrescriptionReleaseResponse classCode=\"INFO\" moodCode=\"EVN\" type=\"ControlAct\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:ppdbatch=\"http://spine.nhs.uk/spine-service-ppd\" xmlns:fn=\"http://www.w3.org/2005/02/xpath-functions\" xmlns:eb=\"http://www.oasis-open.org/committees/ebxml-msg/schema/msg-header-2_0.xsd\" xmlns:soapcsf=\"http://www.w3.org/2001/12/soap-envelope\" xmlns=\"urn:hl7-org:v3\" xmlns:nasp=\"http://spine.nhs.uk/spine-servicev1.0\" xmlns:soap=\"http://www.w3.org/2001/12/soap-envelope\">\n" +
  "<id root=\"96E2F20E-8EA6-0601-B7D9-38778AE4D379\"/>\n" +
  "<effectiveTime value=\"20131210172737\"/>\n" +
  "<component type=\"ActRelationship\" typeCode=\"COMP\" contextConductionInd=\"false\">\n" +
  "<seperatableInd value=\"false\"/>\n" +
  "<templateId extension=\"PORX_MT122003UK32\" root=\"2.16.840.1.113883.2.1.3.2.4.17.120\"/>\n" +
  "<ParentPrescription classCode=\"INFO\" moodCode=\"EVN\">\n" +
  "<id root=\"26FFBA14-5C1F-1547-CC65-14806D837CA7\"/>\n" +
  "<code code=\"163501000000109\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.15\">\n" +
  "               <originalText>Prescription - FocusActOrEvent </originalText>\n" +
  "            </code>\n" +
  "<effectiveTime value=\"20131121121100\"/>\n" +
  "<typeId root=\"2.16.840.1.113883.2.1.3.2.4.18.7\" extension=\"PORX_MT122003UK32\"/>\n" +
  "<recordTarget typeCode=\"RCT\">\n" +
  "               <Patient classCode=\"PAT\">\n" +
  "                  <id extension=\"9446362768\" root=\"2.16.840.1.113883.2.1.4.1\"/>\n" +
  "                  <addr use=\"H\">\n" +
  "                     <streetAddressLine>41 BIRKDALE ROAD</streetAddressLine>\n" +
  "                     <streetAddressLine>STOCKTON-ON-TEES</streetAddressLine>\n" +
  "                     <streetAddressLine>CLEVELAND</streetAddressLine>\n" +
  "                     <postalCode>TS18 5JJ</postalCode>\n" +
  "                     <addressKey>14270728</addressKey>\n" +
  "                     <desc/>\n" +
  "                  </addr>\n" +
  "                  <patientPerson classCode=\"PSN\" determinerCode=\"INSTANCE\">\n" +
  "                     <name use=\"L\">\n" +
  "                        <prefix>MR</prefix>\n" +
  "                        <given>HORATIO</given>\n" +
  "                        <given>THEOBALD</given>\n" +
  "                        <family>FAZAL</family>\n" +
  "                        <suffix/>\n" +
  "                     </name>\n" +
  "                     <administrativeGenderCode code=\"0\"/>\n" +
  "                     <birthTime value=\"19850828\"/>\n" +
  "                     <playedProviderPatient classCode=\"PAT\">\n" +
  "                        <subjectOf typeCode=\"SBJ\">\n" +
  "                           <patientCareProvision classCode=\"PCPR\" moodCode=\"EVN\">\n" +
  "                              <code code=\"1\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.37\"/>\n" +
  "                              <responsibleParty typeCode=\"RESP\">\n" +
  "                                 <healthCareProvider classCode=\"PROV\">\n" +
  "                                    <id extension=\"C81007\" root=\"1.2.826.0.1285.0.1.10\"/>\n" +
  "                                 </healthCareProvider>\n" +
  "                              </responsibleParty>\n" +
  "                           </patientCareProvision>\n" +
  "                        </subjectOf>\n" +
  "                     </playedProviderPatient>\n" +
  "                  </patientPerson>\n" +
  "               </Patient>\n" +
  "            </recordTarget>\n" +
  "<pertinentInformation1 typeCode=\"PERT\" contextConductionInd=\"true\">\n" +
  "<templateId extension=\"CSAB_RM-NPfITUK10.pertinentInformation\" root=\"2.16.840.1.113883.2.1.3.2.4.18.2\"/>\n" +
  "<pertinentPrescription classCode=\"SBADM\" moodCode=\"RQO\">\n" +
  "<id root=\"EBAF4A14-2FB6-322C-E040-950AE0731B49\"/>\n" +
  "<id extension=\"77947A-C81007-5C8D1Z\" root=\"2.16.840.1.113883.2.1.3.2.4.18.8\"/>\n" +
  "<code code=\"225426007\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.15\"/>\n" +
  "<effectiveTime nullFlavor=\"NA\"/>\n" +
  "<repeatNumber>\n" +
  "                     <low value=\"1\"/>\n" +
  "                     <high value=\"1\"/>\n" +
  "                  </repeatNumber>\n" +
  "<performer contextControlCode=\"OP\" typeCode=\"PRF\">\n" +
  "                     <AgentOrgSDS classCode=\"AGNT\">\n" +
  "                        <agentOrganizationSDS classCode=\"ORG\" determinerCode=\"INSTANCE\">\n" +
  "                           <id extension=\"FN002\" root=\"1.2.826.0.1285.0.1.10\"/>\n" +
  "                        </agentOrganizationSDS>\n" +
  "                     </AgentOrgSDS>\n" +
  "                  </performer>\n" +
  "<author contextControlCode=\"OP\" typeCode=\"AUT\">\n" +
  "                     <time value=\"20131121121100\"/>\n" +
  "                     <signatureText>\n" +
  "<Signature xmlns=\"http://www.w3.org/2000/09/xmldsig#\">\n" +
  "<SignedInfo>\n" +
  "<CanonicalizationMethod Algorithm=\"http://www.w3.org/2001/10/xml-exc-c14n#\"/>\n" +
  "<SignatureMethod Algorithm=\"http://www.w3.org/2000/09/xmldsig#rsa-sha1\"/>\n" +
  "<Reference>\n" +
  "<Transforms>\n" +
  "<Transform Algorithm=\"http://www.w3.org/2001/10/xml-exc-c14n#\"/>\n" +
  "</Transforms>\n" +
  "<DigestMethod Algorithm=\"http://www.w3.org/2000/09/xmldsig#sha1\"/>\n" +
  "<DigestValue>S+M5z9Tc/Kt2GmPiRVqsNEXBmSs=</DigestValue>\n" +
  "</Reference>\n" +
  "</SignedInfo>\n" +
  "<SignatureValue>bETBGqTkfC6L4woqFntJjOp3Kjn094Moknx7BQDZc9OuTB+Lf25uOXe2qxuLiW3I4GrY0TMskVUd\n" +
  "5shlZAn/eUhos1mYd5awafz3ioIR7RZrHyQ4tefirCSMJyvRMMxCUwqtgiJrpkIr5wNfg0VqrCEA\n" +
  "pVpIwGYAcBphqPahktZ9CH/Qbs3jTVhVaPQI5Ga6PNjejyfZMmen1Qg63dHxFV3l7afdinArbIUy\n" +
  "2lZ8ralns3IVQ+HNSX0Fqxj7508+Nn4fhP6LNcGfwd6Nz20ujGPEP/4KO5tSmtKS5YXiwLmVJp/m\n" +
  "W0zTMwV1tvylzCS2pUW8AI2e+Qg9rMwc39pfsQ==</SignatureValue>\n" +
  "<KeyInfo>\n" +
  "<X509Data>\n" +
  "<X509Certificate>MIID1zCCAr+gAwIBAgIBGzANBgkqhkiG9w0BAQUFADBHMQ4wDAYDVQQKEwVIU0NJQzEbMBkGA1UE\n" +
  "CxMSU29sdXRpb24gQXNzdXJhbmNlMRgwFgYDVQQDEw9IU0NJQyBTQSBTdWIgQ0EwHhcNMTMwNTAx\n" +
  "MTIzMTE2WhcNMTYwMTI2MTIzMTE2WjBHMQ4wDAYDVQQKEwVIU0NJQzEbMBkGA1UECxMSU29sdXRp\n" +
  "b24gQXNzdXJhbmNlMRgwFgYDVQQDEw9FTVUgR29vZCBTaWduZXIwggEiMA0GCSqGSIb3DQEBAQUA\n" +
  "A4IBDwAwggEKAoIBAQCz5WRahJqNK+AXozLmvYamO5DiRaLSg44j1q++2JYu8yBj/pdZ0XLcz4j/\n" +
  "z3c6tEh4bpRJvkmN10LrrSuSDqCRHah+oyNTCDhzGhzKRcCBVglc1T4ELiznV2guQ8HBdMOyzqml\n" +
  "42dOOUcP/om+tUGW+ErLoayXCvS+tHMbr4TJNpfQmQot+AjdS5iDH3YERtmgLGd7rFhJLR94gqRW\n" +
  "cwI4dMmUWEWI+7e8CnTZPd1JElJaHH5Ym/x47qJ9lTjUznGhH2FYjBtn6eJrd4EJwQiauXIfhFy5\n" +
  "7TMG2rb78gxZDQK5c0uM7V2k83cgDmfV1dCOrBhexr4mKCsRhzlEIapPAgMBAAGjgc0wgcowCQYD\n" +
  "VR0TBAIwADAsBglghkgBhvhCAQ0EHxYdT3BlblNTTCBHZW5lcmF0ZWQgQ2VydGlmaWNhdGUwHQYD\n" +
  "VR0OBBYEFPRf41GG5RTRReX71DFYbSrOOEDlMHAGA1UdIwRpMGeAFHUAoewjdDi3nAmUiNp8SQQT\n" +
  "qYdpoUykSjBIMQ4wDAYDVQQKEwVIU0NJQzEbMBkGA1UECxMSU29sdXRpb24gQXNzdXJhbmNlMRkw\n" +
  "FwYDVQQDExBIU0NJQyBTQSBSb290IENBggECMA0GCSqGSIb3DQEBBQUAA4IBAQBQHnfNzBnTlv6j\n" +
  "AL5qaEyn7zPw2De77VqHXL84r2mVWwjMEypiY1hDSI8Ns5rdzOk+rLPJLqXxT6kHnHsriljWV3Qj\n" +
  "l7LnDF68ernQkodIbAqzMY3zKHVVu0EM5vhGuJnL1vSrs8yev9kNJsf6vjTBPQO1CdT0vAA2tMJ4\n" +
  "LFlUv/51MaUMPx8Rii+GWlyHHHbwsFfbYij4NOiF6e5+TYqR44pX47bcw7YAZRwQYEk+B6Wh4TeV\n" +
  "z6sHGoRYz+hNoDBT/TP7R3+1TGhsnSYNehjKNksPkvW81lmuvFq9vQKervgMXpQ05kKxmATvLYFM\n" +
  "j0uK8dPfgJd5UYs2KZRvlhRP</X509Certificate>\n" +
  "</X509Data>\n" +
  "</KeyInfo>\n" +
  "</Signature>\n" +
  "</signatureText>\n" +
  "                     <AgentPerson classCode=\"AGNT\">\n" +
  "                        <id extension=\"100096757983\" root=\"1.2.826.0.1285.0.2.0.67\"/>\n" +
  "                        <code code=\"R0260\" codeSystem=\"1.2.826.0.1285.0.2.1.104\"/>\n" +
  "                        <telecom use=\"WP\" value=\"tel:01332332812\"/>\n" +
  "                        <agentPerson classCode=\"PSN\" determinerCode=\"INSTANCE\">\n" +
  "                           <id extension=\"3021802\" root=\"1.2.826.0.1285.0.2.1.54\"/>\n" +
  "                           <name use=\"L\">WEIR</name>\n" +
  "                        </agentPerson>\n" +
  "                        <representedOrganization classCode=\"ORG\" determinerCode=\"INSTANCE\">\n" +
  "                           <id extension=\"C81007\" root=\"1.2.826.0.1285.0.1.10\"/>\n" +
  "                           <code code=\"001\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.94\"/>\n" +
  "                           <name>VERNON STREET MEDICAL CTR</name>\n" +
  "                           <telecom use=\"WP\" value=\"tel:01332332812\"/>\n" +
  "                           <addr use=\"WP\">\n" +
  "                              <streetAddressLine>13 VERNON STREET</streetAddressLine>\n" +
  "                              <streetAddressLine>DERBY</streetAddressLine>\n" +
  "                              <streetAddressLine>DERBYSHIRE</streetAddressLine>\n" +
  "                              <postalCode>DE1 1FW</postalCode>\n" +
  "                           </addr>\n" +
  "                           <healthCareProviderLicense classCode=\"PROV\">\n" +
  "                              <Organization classCode=\"ORG\" determinerCode=\"INSTANCE\">\n" +
  "                                 <id extension=\"5EX\" root=\"1.2.826.0.1285.0.1.10\"/>\n" +
  "                                 <code code=\"005\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.94\"/>\n" +
  "                              </Organization>\n" +
  "                           </healthCareProviderLicense>\n" +
  "                        </representedOrganization>\n" +
  "                     </AgentPerson>\n" +
  "                  </author>\n" +
  "<responsibleParty contextControlCode=\"OP\" typeCode=\"RESP\">\n" +
  "                     <AgentPerson classCode=\"AGNT\">\n" +
  "                        <id extension=\"100104917989\" root=\"1.2.826.0.1285.0.2.0.67\"/>\n" +
  "                        <code code=\"R0260\" codeSystem=\"1.2.826.0.1285.0.2.1.104\"/>\n" +
  "                        <telecom use=\"WP\" value=\"tel:01332332812\"/>\n" +
  "                        <agentPerson classCode=\"PSN\" determinerCode=\"INSTANCE\">\n" +
  "                           <id extension=\"G81051\" root=\"1.2.826.0.1285.0.2.1.54\"/>\n" +
  "                           <name use=\"L\">AITCHISON</name>\n" +
  "                        </agentPerson>\n" +
  "                        <representedOrganization classCode=\"ORG\" determinerCode=\"INSTANCE\">\n" +
  "                           <id extension=\"C81007\" root=\"1.2.826.0.1285.0.1.10\"/>\n" +
  "                           <code code=\"001\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.94\"/>\n" +
  "                           <name>VERNON STREET MEDICAL CTR</name>\n" +
  "                           <telecom use=\"WP\" value=\"tel:01332332812\"/>\n" +
  "                           <addr use=\"WP\">\n" +
  "                              <streetAddressLine>13 VERNON STREET</streetAddressLine>\n" +
  "                              <streetAddressLine>DERBY</streetAddressLine>\n" +
  "                              <streetAddressLine>DERBYSHIRE</streetAddressLine>\n" +
  "                              <postalCode>DE1 1FW</postalCode>\n" +
  "                           </addr>\n" +
  "                        </representedOrganization>\n" +
  "                     </AgentPerson>\n" +
  "                  </responsibleParty>\n" +
  "<component1 typeCode=\"COMP\">\n" +
  "                     <seperatableInd value=\"true\"/>\n" +
  "                     <daysSupply classCode=\"SPLY\" moodCode=\"RQO\">\n" +
  "                        <code code=\"373784005\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.15\"/>\n" +
  "                        <effectiveTime>\n" +
  "                           <low value=\"20131121\"/>\n" +
  "                           <high value=\"20140122\"/>\n" +
  "                        </effectiveTime>\n" +
  "                        <expectedUseTime>\n" +
  "                           <width unit=\"d\" value=\"28\"/>\n" +
  "                        </expectedUseTime>\n" +
  "                     </daysSupply>\n" +
  "                  </component1>\n" +
  "<pertinentInformation7 contextConductionInd=\"true\" typeCode=\"PERT\">\n" +
  "                     <seperatableInd value=\"false\"/>\n" +
  "                     <pertinentReviewDate classCode=\"OBS\" moodCode=\"EVN\">\n" +
  "                        <code code=\"RD\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.30\"/>\n" +
  "                        <value value=\"20140122\"/>\n" +
  "                     </pertinentReviewDate>\n" +
  "                  </pertinentInformation7>\n" +
  "<pertinentInformation5 contextConductionInd=\"true\" typeCode=\"PERT\">\n" +
  "                     <seperatableInd value=\"false\"/>\n" +
  "                     <pertinentPrescriptionTreatmentType classCode=\"OBS\" moodCode=\"EVN\">\n" +
  "                        <code code=\"PTT\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.30\"/>\n" +
  "                        <value code=\"0002\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.16.36\"/>\n" +
  "                     </pertinentPrescriptionTreatmentType>\n" +
  "                  </pertinentInformation5>\n" +
  "<pertinentInformation10 type=\"ActRelationship\" typeCode=\"PERT\" contextConductionInd=\"true\">\n" +
  "<seperatableInd updateMode=\"added\" value=\"false\"/>\n" +
  "<pertinentPrescriptionStatus type=\"Observation\" classCode=\"OBS\" moodCode=\"EVN\">\n" +
  "<code code=\"PS\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.30\"/>\n" +
  "<value code=\"0001\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.16.35\" displayName=\"To Be Dispensed\"/>\n" +
  "</pertinentPrescriptionStatus>\n" +
  "</pertinentInformation10>\n" +
  "<pertinentInformation9 type=\"ActRelationship\" typeCode=\"PERT\" contextConductionInd=\"true\">\n" +
  "<seperatableInd value=\"true\"/>\n" +
  "<pertinentLowPermanentExemptionInfo classCode=\"OBS\" moodCode=\"EVN\">\n" +
  "<code code=\"0002\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.16.33\" displayName=\"is under 16 years of age\"/>\n" +
  "<value value=\"20010827\"/>\n" +
  "</pertinentLowPermanentExemptionInfo>\n" +
  "</pertinentInformation9>\n" +
  "<pertinentInformation1 contextConductionInd=\"true\" typeCode=\"PERT\">\n" +
  "                     <seperatableInd value=\"true\"/>\n" +
  "                     <pertinentDispensingSitePreference classCode=\"OBS\" moodCode=\"EVN\">\n" +
  "                        <code code=\"DSP\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.30\"/>\n" +
  "                        <value code=\"P1\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.21\"/>\n" +
  "                     </pertinentDispensingSitePreference>\n" +
  "                  </pertinentInformation1>\n" +
  "<pertinentInformation2 contextConductionInd=\"true\" inversionInd=\"false\" negationInd=\"false\" typeCode=\"PERT\">\n" +
  "<seperatableInd value=\"true\"/>\n" +
  "<templateId extension=\"CSAB_RM-NPfITUK10.sourceOf2\" root=\"2.16.840.1.113883.2.1.3.2.4.18.2\"/>\n" +
  "<pertinentLineItem classCode=\"SBADM\" moodCode=\"RQO\">\n" +
  "<id root=\"EBAF4A14-30A8-322C-E040-950AE0731B49\"/>\n" +
  "<code code=\"225426007\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.15\"/>\n" +
  "<effectiveTime nullFlavor=\"NA\"/>\n" +
  "<repeatNumber>\n" +
  "                           <low value=\"1\"/>\n" +
  "                           <high value=\"1\"/>\n" +
  "                        </repeatNumber>\n" +
  "<product contextControlCode=\"OP\" typeCode=\"PRD\">\n" +
  "                           <manufacturedProduct classCode=\"MANU\">\n" +
  "                              <manufacturedRequestedMaterial classCode=\"MMAT\" determinerCode=\"KIND\">\n" +
  "                                 <code code=\"11445411000001102\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.15\" displayName=\"Combihesive Natura two piece ostomy system flange with mouldable skin barrier and flexible hydrocolloid collar S7551 Mould to fit 22mm-33mm (ConvaTec Ltd)\"/>\n" +
  "                              </manufacturedRequestedMaterial>\n" +
  "                           </manufacturedProduct>\n" +
  "                        </product>\n" +
  "<component typeCode=\"COMP\">\n" +
  "                           <seperatableInd value=\"true\"/>\n" +
  "                           <lineItemQuantity classCode=\"SPLY\" moodCode=\"RQO\">\n" +
  "                              <code code=\"373784005\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.15\"/>\n" +
  "                              <quantity unit=\"1\" value=\"10\">\n" +
  "                                 <translation code=\"3318711000001107\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.15\" displayName=\"device\" value=\"10\"/>\n" +
  "                              </quantity>\n" +
  "                           </lineItemQuantity>\n" +
  "                        </component>\n" +
  "<pertinentInformation4 type=\"ActRelationship\" typeCode=\"PERT\" contextConductionInd=\"true\">\n" +
  "<seperatableInd value=\"false\"/>\n" +
  "<pertinentItemStatus type=\"Observation\" classCode=\"OBS\" moodCode=\"EVN\">\n" +
  "<code code=\"IS\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.30\"/>\n" +
  "<value code=\"0007\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.23\" displayName=\"To Be Dispensed\"/>\n" +
  "</pertinentItemStatus>\n" +
  "</pertinentInformation4>\n" +
  "<pertinentInformation2 contextConductionInd=\"true\" typeCode=\"PERT\">\n" +
  "                           <seperatableInd value=\"false\"/>\n" +
  "                           <pertinentDosageInstructions classCode=\"OBS\" moodCode=\"EVN\">\n" +
  "                              <code code=\"DI\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.30\"/>\n" +
  "                              <value>As Directed</value>\n" +
  "                           </pertinentDosageInstructions>\n" +
  "                        </pertinentInformation2>\n" +
  "</pertinentLineItem>\n" +
  "</pertinentInformation2>\n" +
  "<pertinentInformation2 contextConductionInd=\"true\" inversionInd=\"false\" negationInd=\"false\" typeCode=\"PERT\">\n" +
  "<seperatableInd value=\"true\"/>\n" +
  "<templateId extension=\"CSAB_RM-NPfITUK10.sourceOf2\" root=\"2.16.840.1.113883.2.1.3.2.4.18.2\"/>\n" +
  "<pertinentLineItem classCode=\"SBADM\" moodCode=\"RQO\">\n" +
  "<id root=\"EBAF4A14-30AD-322C-E040-950AE0731B49\"/>\n" +
  "<code code=\"225426007\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.15\"/>\n" +
  "<effectiveTime nullFlavor=\"NA\"/>\n" +
  "<repeatNumber>\n" +
  "                           <low value=\"1\"/>\n" +
  "                           <high value=\"1\"/>\n" +
  "                        </repeatNumber>\n" +
  "<product contextControlCode=\"OP\" typeCode=\"PRD\">\n" +
  "                           <manufacturedProduct classCode=\"MANU\">\n" +
  "                              <manufacturedRequestedMaterial classCode=\"MMAT\" determinerCode=\"KIND\">\n" +
  "                                 <code code=\"8153411000001106\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.15\" displayName=\"Diphtheria / Tetanus / Pertussis (acellular component) / Poliomyelitis (inactivated) vaccine (adsorbed) suspension for injection 0.5ml pre-filled syringes\"/>\n" +
  "                              </manufacturedRequestedMaterial>\n" +
  "                           </manufacturedProduct>\n" +
  "                        </product>\n" +
  "<component typeCode=\"COMP\">\n" +
  "                           <seperatableInd value=\"true\"/>\n" +
  "                           <lineItemQuantity classCode=\"SPLY\" moodCode=\"RQO\">\n" +
  "                              <code code=\"373784005\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.15\"/>\n" +
  "                              <quantity unit=\"1\" value=\"1\">\n" +
  "                                 <translation code=\"non_dmd_units\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.15\" displayName=\"1_pre-filled_disposable_injection\" value=\"1\"/>\n" +
  "                              </quantity>\n" +
  "                           </lineItemQuantity>\n" +
  "                        </component>\n" +
  "<pertinentInformation4 type=\"ActRelationship\" typeCode=\"PERT\" contextConductionInd=\"true\">\n" +
  "<seperatableInd value=\"false\"/>\n" +
  "<pertinentItemStatus type=\"Observation\" classCode=\"OBS\" moodCode=\"EVN\">\n" +
  "<code code=\"IS\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.30\"/>\n" +
  "<value code=\"0007\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.23\" displayName=\"To Be Dispensed\"/>\n" +
  "</pertinentItemStatus>\n" +
  "</pertinentInformation4>\n" +
  "<pertinentInformation2 contextConductionInd=\"true\" typeCode=\"PERT\">\n" +
  "                           <seperatableInd value=\"false\"/>\n" +
  "                           <pertinentDosageInstructions classCode=\"OBS\" moodCode=\"EVN\">\n" +
  "                              <code code=\"DI\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.30\"/>\n" +
  "                              <value>As Directed</value>\n" +
  "                           </pertinentDosageInstructions>\n" +
  "                        </pertinentInformation2>\n" +
  "</pertinentLineItem>\n" +
  "</pertinentInformation2>\n" +
  "<pertinentInformation2 contextConductionInd=\"true\" inversionInd=\"false\" negationInd=\"false\" typeCode=\"PERT\">\n" +
  "<seperatableInd value=\"true\"/>\n" +
  "<templateId extension=\"CSAB_RM-NPfITUK10.sourceOf2\" root=\"2.16.840.1.113883.2.1.3.2.4.18.2\"/>\n" +
  "<pertinentLineItem classCode=\"SBADM\" moodCode=\"RQO\">\n" +
  "<id root=\"EBAF4A14-30B2-322C-E040-950AE0731B49\"/>\n" +
  "<code code=\"225426007\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.15\"/>\n" +
  "<effectiveTime nullFlavor=\"NA\"/>\n" +
  "<repeatNumber>\n" +
  "                           <low value=\"1\"/>\n" +
  "                           <high value=\"1\"/>\n" +
  "                        </repeatNumber>\n" +
  "<product contextControlCode=\"OP\" typeCode=\"PRD\">\n" +
  "                           <manufacturedProduct classCode=\"MANU\">\n" +
  "                              <manufacturedRequestedMaterial classCode=\"MMAT\" determinerCode=\"KIND\">\n" +
  "                                 <code code=\"8153411000001106\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.15\" displayName=\"Diphtheria / Tetanus / Pertussis (acellular component) / Poliomyelitis (inactivated) vaccine (adsorbed) suspension for injection 0.5ml pre-filled syringes\"/>\n" +
  "                              </manufacturedRequestedMaterial>\n" +
  "                           </manufacturedProduct>\n" +
  "                        </product>\n" +
  "<component typeCode=\"COMP\">\n" +
  "                           <seperatableInd value=\"true\"/>\n" +
  "                           <lineItemQuantity classCode=\"SPLY\" moodCode=\"RQO\">\n" +
  "                              <code code=\"373784005\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.15\"/>\n" +
  "                              <quantity unit=\"1\" value=\"1\">\n" +
  "                                 <translation code=\"non_dmd_units\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.15\" displayName=\"pre-filled disposable injection\" value=\"1\"/>\n" +
  "                              </quantity>\n" +
  "                           </lineItemQuantity>\n" +
  "                        </component>\n" +
  "<pertinentInformation4 type=\"ActRelationship\" typeCode=\"PERT\" contextConductionInd=\"true\">\n" +
  "<seperatableInd value=\"false\"/>\n" +
  "<pertinentItemStatus type=\"Observation\" classCode=\"OBS\" moodCode=\"EVN\">\n" +
  "<code code=\"IS\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.30\"/>\n" +
  "<value code=\"0007\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.23\" displayName=\"To Be Dispensed\"/>\n" +
  "</pertinentItemStatus>\n" +
  "</pertinentInformation4>\n" +
  "<pertinentInformation2 contextConductionInd=\"true\" typeCode=\"PERT\">\n" +
  "                           <seperatableInd value=\"false\"/>\n" +
  "                           <pertinentDosageInstructions classCode=\"OBS\" moodCode=\"EVN\">\n" +
  "                              <code code=\"DI\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.30\"/>\n" +
  "                              <value>As Directed</value>\n" +
  "                           </pertinentDosageInstructions>\n" +
  "                        </pertinentInformation2>\n" +
  "</pertinentLineItem>\n" +
  "</pertinentInformation2>\n" +
  "<pertinentInformation11 type=\"ActRelationship\" typeCode=\"PERT\" contextConductionInd=\"true\">\n" +
  "<seperatableInd value=\"true\"/>\n" +
  "<pertinentHighPermanentExemptionInfo classCode=\"OBS\" moodCode=\"EVN\">\n" +
  "<code code=\"0004\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.16.33\" displayName=\"is 60 years of age or over\"/>\n" +
  "<value value=\"20450828\"/>\n" +
  "</pertinentHighPermanentExemptionInfo>\n" +
  "</pertinentInformation11>\n" +
  "<pertinentInformation8 contextConductionInd=\"true\" typeCode=\"PERT\">\n" +
  "                     <seperatableInd value=\"false\"/>\n" +
  "                     <pertinentTokenIssued classCode=\"OBS\" moodCode=\"EVN\">\n" +
  "                        <code code=\"TI\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.30\"/>\n" +
  "                        <value value=\"true\"/>\n" +
  "                     </pertinentTokenIssued>\n" +
  "                  </pertinentInformation8>\n" +
  "<pertinentInformation4 contextConductionInd=\"true\" typeCode=\"PERT\">\n" +
  "                     <seperatableInd value=\"false\"/>\n" +
  "                     <pertinentPrescriptionType classCode=\"OBS\" moodCode=\"EVN\">\n" +
  "                        <code code=\"PT\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.30\"/>\n" +
  "                        <value code=\"0103\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.25\"/>\n" +
  "                     </pertinentPrescriptionType>\n" +
  "                  </pertinentInformation4>\n" +
  "</pertinentPrescription>\n" +
  "</pertinentInformation1>\n" +
  "<pertinentInformation2 typeCode=\"PERT\">\n" +
  "               <templateId extension=\"CSAB_RM-NPfITUK10.pertinentInformation1\" root=\"2.16.840.1.113883.2.1.3.2.4.18.2\"/>\n" +
  "               <pertinentCareRecordElementCategory classCode=\"CATEGORY\" moodCode=\"EVN\">\n" +
  "                  <code code=\"185361000000102\" codeSystem=\"2.16.840.1.113883.2.1.3.2.4.15\"/>\n" +
  "                  <component typeCode=\"COMP\">\n" +
  "                     <actRef classCode=\"SBADM\" moodCode=\"RQO\">\n" +
  "                        <id root=\"EBAF4A14-30A8-322C-E040-950AE0731B49\"/>\n" +
  "                     </actRef>\n" +
  "                  </component>\n" +
  "                  <component typeCode=\"COMP\">\n" +
  "                     <actRef classCode=\"SBADM\" moodCode=\"RQO\">\n" +
  "                        <id root=\"EBAF4A14-30AD-322C-E040-950AE0731B49\"/>\n" +
  "                     </actRef>\n" +
  "                  </component>\n" +
  "                  <component typeCode=\"COMP\">\n" +
  "                     <actRef classCode=\"SBADM\" moodCode=\"RQO\">\n" +
  "                        <id root=\"EBAF4A14-30B2-322C-E040-950AE0731B49\"/>\n" +
  "                     </actRef>\n" +
  "                  </component>\n" +
  "               </pertinentCareRecordElementCategory>\n" +
  "            </pertinentInformation2>\n" +
  "</ParentPrescription>\n" +
  "</component>\n" +
  "<pertinentInformation typeCode=\"PERT\" contextConductionInd=\"true\">\n" +
  "<seperatableInd value=\"false\"/>\n" +
  "<pertinentBatchInfo moodCode=\"EVN\" classCode=\"OBS\">\n" +
  "<code codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.14\" code=\"1\"/>\n" +
  "<value value=\"1\"/>\n" +
  "</pertinentBatchInfo>\n" +
  "</pertinentInformation>\n" +
  "<pertinentInformation typeCode=\"PERT\" contextConductionInd=\"true\">\n" +
  "<seperatableInd value=\"false\"/>\n" +
  "<pertinentBatchInfo moodCode=\"EVN\" classCode=\"OBS\">\n" +
  "<code codeSystem=\"2.16.840.1.113883.2.1.3.2.4.17.14\" code=\"2\"/>\n" +
  "<value value=\"25\"/>\n" +
  "</pertinentBatchInfo>\n" +
  "</pertinentInformation>\n" +
  "<inFulfillmentOf type=\"ActRelationship\" typeCode=\"FLFS\" inversionInd=\"false\" negationInd=\"false\">\n" +
  "<seperatableInd value=\"true\"/>\n" +
  "<priorDownloadRequestRef type=\"ControlAct\" classCode=\"INFO\" moodCode=\"RQO\">\n" +
  "<id root=\"EBAF4A14-3323-322C-E040-950AE0731B49\"/>\n" +
  "</priorDownloadRequestRef>\n" +
  "</inFulfillmentOf>\n" +
  "</PrescriptionReleaseResponse>\n" +
  "</hl7:subject>\n" +
  "</hl7:ControlActEvent>\n" +
  "</hl7:PORX_IN070101UK31>"

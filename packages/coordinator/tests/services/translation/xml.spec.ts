import {
  readXml,
  readXmlStripNamespace,
  writeXmlStringCanonicalized,
  writeXmlStringPretty
} from "../../../src/services/serialisation/xml"
import * as TestResources from "../../resources/test-resources"
import path from "path";
import fs from "fs";
import * as XmlJs from "xml-js";
import {ElementCompact} from "xml-js";

const defaultCanonicalizationMethod = "http://www.w3.org/2001/10/xml-exc-c14n#"


describe("writeXmlStringCanonicalized canonicalizes signed info XML correctly", () => {
  test("writeXmlStringCanonicalized for signed info returns correct value", async () => {

    console.log( "path :", path.join(__dirname, "../../resources/signature-fragments/signedinfo.xml"))

    const digestStr = fs.readFileSync(
      path.join(__dirname, "../../resources/signature-fragments/signedinfo.xml"),
      "utf8"
    )

    const digest = XmlJs.xml2js(digestStr, {compact: true}) as ElementCompact

    const fragments = digest
    const actualOutput = await writeXmlStringCanonicalized(fragments, defaultCanonicalizationMethod)

    console.log("after canonicalization ", actualOutput)
    expect(actualOutput).toEqual("this will fail")
  })

  //TODO - add more tests to prove that XML is correctly canonicalized
})


describe("writeXmlStringCanonicalized canonicalizes XML correctly", () => {
  test("writeXmlStringCanonicalized returns correct value", async () => {
    const fragments = TestResources.specification[0].hl7V3SignatureFragments
    const actualOutput = await writeXmlStringCanonicalized(fragments, defaultCanonicalizationMethod)
    const expectedOutput = TestResources.specification[0].hl7V3FragmentsCanonicalized
    expect(actualOutput).toEqual(expectedOutput)
  })

  //TODO - add more tests to prove that XML is correctly canonicalized
})

describe("writeXml escapes XML chars in attributes", () => {
  test.each([
    {
      inAttr: "test&test",
      outPretty: '<tag attr="test&amp;test"/>',
      outCannon: '<tag attr="test&amp;test"></tag>'
    },
    {
      inAttr: "test<test",
      outPretty: '<tag attr="test&lt;test"/>',
      outCannon: '<tag attr="test&lt;test"></tag>'
    },
    {
      inAttr: "test>test",
      outPretty: '<tag attr="test&gt;test"/>',
      outCannon: '<tag attr="test>test"></tag>'
    },
    {
      inAttr: 'test"test',
      outPretty: '<tag attr="test&quot;test"/>',
      outCannon: '<tag attr="test&quot;test"></tag>'
    },
    {
      inAttr: "test'test",
      outPretty: '<tag attr="test&#39;test"/>',
      outCannon: '<tag attr="test\'test"></tag>'
    },
    {
      inAttr: undefined as string,
      outPretty: "<tag/>",
      outCannon: "<tag></tag>"
    }
  ])("writeXml escapes attributes", async (escapeCase) => {
    const tag = {
      tag: {
        _attributes: {
          attr: escapeCase.inAttr
        }
      }
    }
    const canonicalized = await writeXmlStringCanonicalized(tag, defaultCanonicalizationMethod)
    expect(writeXmlStringPretty(tag)).toEqual(escapeCase.outPretty)
    expect(canonicalized).toEqual(escapeCase.outCannon)
  })

  test.each([
    {
      inText: "<inner>this &amp; that</inner>",
      outPretty: "<tag>&lt;inner&gt;this &amp;amp; that&lt;/inner&gt;</tag>",
      outCannon: "<tag>&lt;inner&gt;this &amp;amp; that&lt;/inner&gt;</tag>"
    },
    {
      inText: "<inner>this &lt; that &gt; other</inner>",
      outPretty: "<tag>&lt;inner&gt;this &amp;lt; that &amp;gt; other&lt;/inner&gt;</tag>",
      outCannon: "<tag>&lt;inner&gt;this &amp;lt; that &amp;gt; other&lt;/inner&gt;</tag>"
    }
  ])("writeXml double escapes text", async (escapeCase) => {
    const tag = {
      tag: {
        _text: escapeCase.inText
      }
    }
    const canonicalized = await writeXmlStringCanonicalized(tag, defaultCanonicalizationMethod)
    expect(writeXmlStringPretty(tag)).toEqual(escapeCase.outPretty)
    expect(canonicalized).toEqual(escapeCase.outCannon)
  })
})

describe("readXml handles namespaces correctly", () => {
  const xmlWithNamespace = '<ns:tag attr="test"/>'
  const xmlWithoutNamespace = '<tag attr="test"/>'
  const jsWithNamespace = {
    "ns:tag": {
      _attributes: {
        attr: "test"
      }
    }
  }
  const jsWithoutNamespace = {
    tag: {
      _attributes: {
        attr: "test"
      }
    }
  }

  test("readXmlStripNamespace removes namespace from XML tags when present", () => {
    const tag = readXmlStripNamespace(xmlWithNamespace)
    expect(tag).toEqual(jsWithoutNamespace)
  })

  test("readXmlStripNamespace does not modify tag names when namespace is not present", () => {
    const tag = readXmlStripNamespace(xmlWithoutNamespace)
    expect(tag).toEqual(jsWithoutNamespace)
  })

  test("readXml preserves namespaces in XML tags when present", () => {
    const tag = readXml(xmlWithNamespace)
    expect(tag).toEqual(jsWithNamespace)
  })

  test("readXml does not modify tag names when namespace is not present", () => {
    const tag = readXml(xmlWithoutNamespace)
    expect(tag).toEqual(jsWithoutNamespace)
  })
})

describe("converts streetAddressLine to array correctly", () => {
  const xmlWithSingleAddressLine =
    "<addr><streetAddressLine>SALTERS LANE</streetAddressLine><postalCode>TS21 3EE</postalCode></addr>"
  const xmlWithMultipleAddressLine = `<addr>
    <streetAddressLine>SALTERS LANE</streetAddressLine>
    <streetAddressLine>Another Line</streetAddressLine>
    <postalCode>TS21 3EE</postalCode>
  </addr>`
  const jsWithSingleAddressLine = {
    addr: {
      streetAddressLine: [
        {
          _text: "SALTERS LANE"
        }
      ],
      postalCode: {
        _text: "TS21 3EE"
      }
    }
  }
  const jsWithMultipleAddressLine = {
    addr: {
      streetAddressLine: [
        {
          _text: "SALTERS LANE"
        },
        {
          _text: "Another Line"
        }
      ],
      postalCode: {
        _text: "TS21 3EE"
      }
    }
  }

  test("readXmlStripNamespace returns array of streetAddressLine when one address line present", () => {
    const result = readXmlStripNamespace(xmlWithSingleAddressLine)
    expect(result).toEqual(jsWithSingleAddressLine)
  })

  test("readXmlStripNamespace returns array of streetAddressLine when multiple address line present", () => {
    const result = readXmlStripNamespace(xmlWithMultipleAddressLine)
    expect(result).toEqual(jsWithMultipleAddressLine)
  })
})

describe("readXml reads XML chars in node text", () => {
  const xmlWithSpecialChar = "<patientInfo>Jennifer &quot;Bede&quot; O&apos;Reilly &amp; Máirín MacCarron</patientInfo>"
  const jsWithSpecialChar = {patientInfo: {_text: `Jennifer "Bede" O'Reilly & Máirín MacCarron`}}
  test("XML special characters are read by readXml", () => {
    const result = readXmlStripNamespace(xmlWithSpecialChar)
    expect(result).toEqual(jsWithSpecialChar)
  })
})

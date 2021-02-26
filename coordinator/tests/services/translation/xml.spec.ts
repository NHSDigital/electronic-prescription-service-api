import {writeXmlStringCanonicalized, writeXmlStringPretty} from "../../../src/services/serialisation/xml"
import * as TestResources from "../../resources/test-resources"

test("writeXmlStringCanonicalized returns correct value", () => {
  const actualOutput = writeXmlStringCanonicalized(TestResources.examplePrescription1.hl7V3SignatureFragments)
  const expectedOutput = TestResources.examplePrescription1.hl7V3FragmentsCanonicalized
  expect(actualOutput).toEqual(expectedOutput)
})

//TODO - add more tests to prove that XML is correctly canonicalized

test("writeXml escapes ampersand in attributes", () => {
  const tag = {
    tag: {
      _attributes: {
        attr: "test&test"
      }
    }
  }
  expect(writeXmlStringPretty(tag)).toEqual("<tag attr=\"test&amp;test\"/>")
  expect(writeXmlStringCanonicalized(tag)).toEqual("<tag attr=\"test&amp;test\"></tag>")
})

test("writeXml escapes less than in attributes", () => {
  const tag = {
    tag: {
      _attributes: {
        attr: "test<test"
      }
    }
  }
  expect(writeXmlStringPretty(tag)).toEqual("<tag attr=\"test&lt;test\"/>")
  expect(writeXmlStringCanonicalized(tag)).toEqual("<tag attr=\"test&lt;test\"></tag>")
})

test("writeXml escapes greater than in attributes", () => {
  const tag = {
    tag: {
      _attributes: {
        attr: "test>test"
      }
    }
  }
  expect(writeXmlStringPretty(tag)).toEqual("<tag attr=\"test&gt;test\"/>")
  expect(writeXmlStringCanonicalized(tag)).toEqual("<tag attr=\"test&gt;test\"></tag>")
})

test("writeXml escapes double quote in attributes", () => {
  const tag = {
    tag: {
      _attributes: {
        attr: "test\"test"
      }
    }
  }
  expect(writeXmlStringPretty(tag)).toEqual("<tag attr=\"test&quot;test\"/>")
  expect(writeXmlStringCanonicalized(tag)).toEqual("<tag attr=\"test&quot;test\"></tag>")
})

test("writeXml escapes single quote in attributes", () => {
  const tag = {
    tag: {
      _attributes: {
        attr: "test'test"
      }
    }
  }
  expect(writeXmlStringPretty(tag)).toEqual("<tag attr=\"test&#39;test\"/>")
  expect(writeXmlStringCanonicalized(tag)).toEqual("<tag attr=\"test&#39;test\"></tag>")
})

test("writeXml escapes the ampersand in the string &quot; in attributes", () => {
  const tag = {
    tag: {
      _attributes: {
        attr: "test&quot;test"
      }
    }
  }
  expect(writeXmlStringPretty(tag)).toEqual("<tag attr=\"test&amp;quot;test\"/>")
  expect(writeXmlStringCanonicalized(tag)).toEqual("<tag attr=\"test&amp;quot;test\"></tag>")
})

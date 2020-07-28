import {writeXmlStringCanonicalized} from "../../../src/services/translation/xml";
import * as TestResources from "../../resources/test-resources";

test("writeXmlStringCanonicalized returns correct value", () => {
    const actualOutput = writeXmlStringCanonicalized(TestResources.examplePrescription1.hl7V3SignatureFragments)
    const expectedOutput = TestResources.examplePrescription1.hl7V3FragmentsCanonicalized
    expect(actualOutput).toEqual(expectedOutput)
})

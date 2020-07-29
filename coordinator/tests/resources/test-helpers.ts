import * as XmlJs from "xml-js";
import {sortAttributes} from "../../src/services/translation/xml";

export function clone<T>(input: T): T {
    return JSON.parse(JSON.stringify(input))
}

export function xmlTest(actualRoot: XmlJs.ElementCompact, expectedRoot: XmlJs.ElementCompact): () => void {
    return () => {
        const options = {
            compact: true,
            spaces: 4,
            attributesFn: sortAttributes
        } as unknown as XmlJs.Options.JS2XML
        const actualXmlStr = XmlJs.js2xml(actualRoot, options)
        const expectedXmlStr = XmlJs.js2xml(expectedRoot, options)
        expect(actualXmlStr).toEqual(expectedXmlStr)
    }
}

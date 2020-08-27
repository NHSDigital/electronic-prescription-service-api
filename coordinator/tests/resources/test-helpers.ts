import * as XmlJs from "xml-js"
import {sortAttributes} from "../../src/services/translation/xml"
import * as LosslessJson from "lossless-json"

export function clone<T>(input: T): T {
  return LosslessJson.parse(LosslessJson.stringify(input))
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

export{}
declare global {
  interface Array<T> {
    removeAll(elems: T[]): void;
  }
}

if (!Array.prototype.removeAll) {
  Array.prototype.removeAll = function<T>(this: T[], elems: T[]): void {
    elems.reverse().forEach(e => {
      const index = this.indexOf(e)
      this.splice(index, 1)
    })
  }
}

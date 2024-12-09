import * as XmlJs from "xml-js"
import xmldom from "@xmldom/xmldom"
import c14n from "xml-c14n"

export function writeXmlStringCanonicalized(
  tag: XmlJs.ElementCompact,
  canonicalizationMethod: string
): Promise<string> {
  const xmlString = writeXml(tag, 0, true)
  const xmlDocument = (new xmldom.DOMParser()).parseFromString(xmlString, "application/xml")
  const canonicaliser = c14n().createCanonicaliser(canonicalizationMethod)
  return new Promise((resolve, reject) => {
    canonicaliser.canonicalise(xmlDocument.documentElement, function(err, result) {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

export function writeXmlStringPretty(tag: XmlJs.ElementCompact): string {
  return writeXml(tag, 2, false)
}

function writeXml(tag: XmlJs.ElementCompact, spaces: number, fullTagEmptyElement: boolean): string {
  // xml-js decodes ampersands in text before re-encoding everything
  // (https://github.com/nashwaan/xml-js/blob/master/lib/js2xml.js#L121)
  // this prevents us from putting encoded XML with ampersands into the text of a node
  // so this function preemptively encodes those ampersands within node text to override that behavior
  function replaceAmps(element: XmlJs.ElementCompact) {
    if (typeof element !== "object") {
      return
    }
    if (typeof element._text === "string") {
      element._text = element._text.replace(/&/g, "&amp;")
    }
    for (const key in element) {
      if (Object.prototype.hasOwnProperty.call(element, key)) {
        const nodes = Array.isArray(element[key]) ? element[key] : [element[key]]
        for (const node of nodes) {
          replaceAmps(node)
        }
      }
    }
  }
  const withoutAmps = JSON.parse(JSON.stringify(tag))
  replaceAmps(withoutAmps)
  const options = {
    compact: true,
    spaces,
    ignoreComment: true,
    fullTagEmptyElement,
    attributeValueFn: canonicaliseAttribute,
    attributesFn: sortAttributes
  } as unknown as XmlJs.Options.JS2XML //declared type for attributesFn is wrong :(
  return XmlJs.js2xml(withoutAmps, options)
}

export function canonicaliseAttribute(attribute: string): string {
  attribute = attribute.replace(/[\t\f]+/g, " ")
  attribute = attribute.replace(/\r?\n/g, " ")
  return attribute
}

export function namespacedCopyOf<T extends XmlJs.ElementCompact>(tag: T): T {
  const newTag: T = {...tag}
  newTag._attributes = {
    xmlns: "urn:hl7-org:v3",
    ...newTag._attributes
  }
  return newTag
}

export function sortAttributes(attributes: XmlJs.Attributes, currentElementName: string): XmlJs.Attributes {
  if (currentElementName === "xml") {
    return attributes
  }
  const newAttributes: XmlJs.Attributes = {
    xmlns: attributes.xmlns
  }
  Object.getOwnPropertyNames(attributes)
    .sort((a, b) => a.localeCompare(b))
    .forEach((propertyName) => (newAttributes[propertyName] = escapeXmlChars(attributes[propertyName])))
  return newAttributes
}

/**
 * This is a workaround for a bug in XmlJs
 * https://github.com/nashwaan/xml-js/issues/69
 * TODO - remove once the above issue is resolved
 */
function escapeXmlChars(attribute: string | number): string | number {
  if (typeof attribute === "string") {
    attribute = attribute.replace(/&/g, "&amp;")
    attribute = attribute.replace(/</g, "&lt;")
    attribute = attribute.replace(/>/g, "&gt;")
    attribute = attribute.replace(/"/g, "&quot;")
    attribute = attribute.replace(/'/g, "&#39;")
  }
  return attribute
}

export function readXml(text: string): XmlJs.ElementCompact {
  return XmlJs.xml2js(text, {
    compact: true
  })
}

export function readXmlStripNamespace(text: string): XmlJs.ElementCompact {
  return XmlJs.xml2js(text, {
    compact: true,
    elementNameFn: stripNamespace,
    alwaysArray: ["streetAddressLine"]
  })
}

function stripNamespace(elementName: string) {
  const index = elementName.indexOf(":")
  if (index === -1) {
    return elementName
  } else {
    return elementName.substring(index + 1)
  }
}

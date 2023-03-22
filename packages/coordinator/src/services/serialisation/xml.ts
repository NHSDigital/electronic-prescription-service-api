import * as XmlJs from "xml-js"

export function writeXmlStringCanonicalized(tag: XmlJs.ElementCompact): string {
  return writeXml(tag, 0, true)
}

export function writeXmlStringPretty(tag: XmlJs.ElementCompact): string {
  return writeXml(tag, 2, false)
}

function writeXml(tag: XmlJs.ElementCompact, spaces: number, fullTagEmptyElement: boolean): string {
  const options = {
    compact: true,
    spaces,
    ignoreComment: true,
    fullTagEmptyElement,
    attributeValueFn: canonicaliseAttribute,
    attributesFn: sortAttributes
  } as unknown as XmlJs.Options.JS2XML //declared type for attributesFn is wrong :(
  return XmlJs.js2xml(tag, options)
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
    .sort()
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

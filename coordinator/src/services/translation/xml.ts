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
  const newTag = {...tag} as T
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
  const newAttributes = {
    xmlns: attributes.xmlns
  } as XmlJs.Attributes
  Object.getOwnPropertyNames(attributes)
    .sort()
    .forEach(propertyName => newAttributes[propertyName] = attributes[propertyName])
  return newAttributes
}

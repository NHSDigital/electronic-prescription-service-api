import * as XmlJs from "xml-js"

export function writeXmlStringCanonicalized(tag: XmlJs.ElementCompact): string {
    const options = {
        compact: true,
        ignoreComment: true,
        fullTagEmptyElement: true,
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

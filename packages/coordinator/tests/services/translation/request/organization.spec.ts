import {convertOrganizationAndProviderLicense} from "../../../../src/services/translation/request/organization"
import * as uuid from "uuid"
import {fhir, processingErrors as errors} from "@models"
import {getMessageHeader} from "../../../../src/services/translation/common/getResourcesOfType"

function bundleOf(resources: Array<fhir.Resource>): fhir.Bundle {
  return {
    resourceType: "Bundle",
    id: uuid.v4(),
    entry: resources.map(resource => ({resource, fullUrl: `urn:uuid:${resource.id}`}))
  }
}

describe("convertOrganizationAndProviderLicense", () => {
  let messageHeader: fhir.MessageHeader
  let organization1: fhir.Organization
  let organization2: fhir.Organization
  let healthcareService: fhir.HealthcareService
  let location: fhir.Location
  let bundle: fhir.Bundle

  beforeEach(() => {
    messageHeader = {
      resourceType: "MessageHeader",
      eventCoding: {
        code: fhir.EventCodingCode.PRESCRIPTION
      },
      sender: {
        identifier: {
          system: "",
          value: ""
        }
      },
      source: {
        endpoint: ""
      },
      focus: []
    }
    organization2 = {
      resourceType: "Organization",
      id: uuid.v4(),
      identifier: [{
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: "ORG002"
      }],
      type: [{
        coding: [{
          system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
          code: "197"
        }]
      }],
      name: "Organization 2",
      telecom: [{
        use: "WP",
        value: "22222222222"
      }],
      address: [{
        use: "WP",
        line: [
          "Organization 2 Address"
        ]
      }]
    }
    organization1 = {
      resourceType: "Organization",
      id: uuid.v4(),
      identifier: [{
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: "ORG001"
      }],
      type: [{
        coding: [{
          system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
          code: "198"
        }]
      }],
      name: "Organization 1",
      telecom: [{
        use: "work",
        value: "11111111111"
      }],
      address: [{
        use: "work",
        line: [
          "Organization 1 Address"
        ]
      }],
      partOf: {
        reference: `urn:uuid:${organization2.id}`
      }
    }
    location = {
      resourceType: "Location",
      id: uuid.v4(),
      address: {
        use: "work",
        line: ["Healthcare Service Address"]
      }
    }
    healthcareService = {
      resourceType: "HealthcareService",
      id: uuid.v4(),
      identifier: [{
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: "HS001"
      }],
      name: "Healthcare Service",
      telecom: [{
        use: "work",
        value: "33333333333"
      }],
      location: [{
        reference: `urn:uuid:${location.id}`
      }]
    }
    bundle = bundleOf([messageHeader, organization1, organization2, healthcareService, location])
  })

  describe.each([
    ["cancellations", fhir.EventCodingCode.CANCELLATION],
    ["orders", fhir.EventCodingCode.PRESCRIPTION]
  ])("representedOrganization mapping for %s", (desc: string, messageType: fhir.EventCodingCode) => {
    describe("when organization is an NHS trust", () => {
      beforeEach(() => {
        getMessageHeader(bundle).eventCoding.code = messageType
        organization1.type.forEach(type => type.coding.forEach(coding => coding.code = "197"))
      })

      test("doesn't throw if HealthcareService not passed to method", () => {
        expect(() => {
          convertOrganizationAndProviderLicense(bundle, organization1, undefined)
        }).not.toThrow()
      })

      test("throws if Location not present in bundle", () => {
        expect(() => {
          bundle = bundleOf([messageHeader, organization1, organization2, healthcareService])
          convertOrganizationAndProviderLicense(bundle, organization1, healthcareService)
        }).toThrow(errors.FhirMessageProcessingError)
      })

      test("throws if Location is ambiguous", () => {
        expect(() => {
          healthcareService.location.push({
            reference: `urn:uuid:${uuid.v4()}`
          })
          convertOrganizationAndProviderLicense(bundle, organization1, healthcareService)
        }).toThrow(errors.FhirMessageProcessingError)
      })

      test.each([
        "identifier",
        "name",
        "location",
        "telecom"
      ])("throws if %s not present in HealthcareService", (field: string) => {
        expect(() => {
          delete (healthcareService as unknown as Record<string, unknown>)[field]
          convertOrganizationAndProviderLicense(bundle, organization1, healthcareService)
        }).toThrow(errors.FhirMessageProcessingError)
      })

      test("throws if telecom is ambiguous", () => {
        expect(() => {
          healthcareService.telecom.push({
            use: "work",
            value: "44444444444"
          })
          convertOrganizationAndProviderLicense(bundle, organization1, healthcareService)
        }).toThrow(errors.FhirMessageProcessingError)
      })

      test("throws if address not present in Location", () => {
        expect(() => {
          delete location.address
          convertOrganizationAndProviderLicense(bundle, organization1, healthcareService)
        }).toThrow(errors.FhirMessageProcessingError)
      })

      test.each([
        "address",
        "telecom"
      ])("does not throw if %s not present in Organization", (field: string) => {
        delete organization1.partOf
        expect(() => {
          delete (organization1 as unknown as Record<string, unknown>)[field]
          convertOrganizationAndProviderLicense(bundle, organization1, healthcareService)
        }).not.toThrow()
      })

      test("uses HealthcareService for organization details", () => {
        const org = convertOrganizationAndProviderLicense(bundle, organization1, healthcareService)
        expect(org.id._attributes.extension).toBe("HS001")
        expect(org.code._attributes.code).toBe("999")
        expect(org.name._text).toBe("Healthcare Service")
        expect(org.addr.streetAddressLine[0]._text).toBe("Healthcare Service Address")
        expect(org.telecom._attributes.value).toBe("tel:33333333333")
      })
    })

    describe.each([
      ["not an NHS trust", "198"],
      ["of an unspecified type", undefined]
    ])("when organization is %s", (desc: string, code: string) => {
      beforeEach(() => {
        if (code) {
          organization1.type.forEach(type => type.coding.forEach(coding => coding.code = code))
        } else {
          delete organization1.type
        }
      })

      test("does not throw if HealthcareService not passed to method", () => {
        expect(() => {
          convertOrganizationAndProviderLicense(bundle, organization1, undefined)
        }).not.toThrow()
      })

      test.each([
        "identifier",
        "name",
        "address",
        "telecom"
      ])("throws if %s not present in Organization", (field: string) => {
        expect(() => {
          delete (organization1 as unknown as Record<string, unknown>)[field]
          convertOrganizationAndProviderLicense(bundle, organization1, undefined)
        }).toThrow(errors.FhirMessageProcessingError)
      })

      test("throws if address is ambiguous", () => {
        expect(() => {
          organization1.address.push({
            use: "work",
            line: ["Organization 1 Mystery Alternative Address"]
          })
          convertOrganizationAndProviderLicense(bundle, organization1, undefined)
        }).toThrow(errors.FhirMessageProcessingError)
      })

      test("throws if telecom is ambiguous", () => {
        expect(() => {
          organization1.telecom.push({
            use: "work",
            value: "55555555555"
          })
          convertOrganizationAndProviderLicense(bundle, organization1, undefined)
        }).toThrow(errors.FhirMessageProcessingError)
      })

      test("uses Organization for organization details if Healthcare Service not present", () => {
        const org = convertOrganizationAndProviderLicense(bundle, organization1, undefined)
        expect(org.id._attributes.extension).toBe("ORG001")
        expect(org.code._attributes.code).toBe("999")
        expect(org.name._text).toBe("Organization 1")
        expect(org.addr.streetAddressLine[0]._text).toBe("Organization 1 Address")
        expect(org.telecom._attributes.value).toBe("tel:11111111111")
      })
    })
  })

  describe("provider licence mapping for cancellations", () => {
    describe.each([
      ["an NHS trust", "197"],
      ["not an NHS trust", "198"],
      ["of an unspecified type", undefined]
    ])("when organization is %s", (desc: string, code: string) => {
      beforeEach(() => {
        getMessageHeader(bundle).eventCoding.code = fhir.EventCodingCode.CANCELLATION
        if (code) {
          organization1.type.forEach(type => type.coding.forEach(coding => coding.code = code))
        } else {
          delete organization1.type
        }
      })

      test("is not performed", () => {
        const org = convertOrganizationAndProviderLicense(bundle, organization1, healthcareService)
        expect(org.healthCareProviderLicense).toBeFalsy()
      })
    })
  })

  describe("provider licence mapping for orders", () => {
    describe.each([
      ["an NHS trust", "197"],
      ["not an NHS trust", "198"],
      ["of an unspecified type", undefined]
    ])("when organization is %s", (desc: string, code: string) => {
      beforeEach(() => {
        getMessageHeader(bundle).eventCoding.code = fhir.EventCodingCode.PRESCRIPTION
        if (code) {
          organization1.type.forEach(type => type.coding.forEach(coding => coding.code = code))
        } else {
          delete organization1.type
        }
      })

      describe("when organization.partOf is present", () => {
        test.each([
          "identifier",
          "name"
        ])("throws if %s not present in parent Organization", (field: string) => {
          expect(() => {
            delete (organization2 as unknown as Record<string, unknown>)[field]
            convertOrganizationAndProviderLicense(bundle, organization1, healthcareService)
          }).toThrow(errors.FhirMessageProcessingError)
        })

        test.each([
          "address",
          "telecom"
        ])("does not throw if %s not present in parent Organization", (field: string) => {
          expect(() => {
            delete (organization2 as unknown as Record<string, unknown>)[field]
            convertOrganizationAndProviderLicense(bundle, organization1, healthcareService)
          }).not.toThrow()
        })

        test("uses parent Organization for organization details", () => {
          const org = convertOrganizationAndProviderLicense(bundle, organization1, healthcareService)
          const parentOrg = org.healthCareProviderLicense.Organization
          expect(parentOrg.id._attributes.extension).toBe("ORG002")
          expect(parentOrg.code._attributes.code).toBe("999")
          expect(parentOrg.name._text).toBe("Organization 2")
          expect(parentOrg.addr).toBeFalsy()
          expect(parentOrg.telecom).toBeFalsy()
        })
      })

      describe("when organization.partOf is not present", () => {
        beforeEach(() => {
          delete organization1.partOf
        })

        test.each([
          "identifier",
          "name"
        ])("throws if %s not present in Organization", (field: string) => {
          expect(() => {
            delete (organization1 as unknown as Record<string, unknown>)[field]
            convertOrganizationAndProviderLicense(bundle, organization1, healthcareService)
          }).toThrow(errors.FhirMessageProcessingError)
        })

        test("uses Organization for organization details", () => {
          const org = convertOrganizationAndProviderLicense(bundle, organization1, healthcareService)
          const parentOrg = org.healthCareProviderLicense.Organization
          expect(parentOrg.id._attributes.extension).toBe("ORG001")
          expect(parentOrg.code._attributes.code).toBe("999")
          expect(parentOrg.name._text).toBe("Organization 1")
          expect(parentOrg.addr).toBeFalsy()
          expect(parentOrg.telecom).toBeFalsy()
        })
      })
    })
  })
})

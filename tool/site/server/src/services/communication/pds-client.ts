import {OperationOutcome, Patient} from "fhir/r4"
import axios, {AxiosRequestHeaders, AxiosResponse} from "axios"
import {CONFIG} from "../../config"
import {Ping} from "../../routes/health/get-status"
import * as uuid from "uuid"
import {isInt} from "../environment"

class PdsClient {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async makeGetPatientRequest(nhsNumber: string): Promise<Patient | OperationOutcome> {
    return Promise.resolve({
      "resourceType": "Patient",
      "id": "9000000009",
      "identifier": [
        {
          "system": "https://fhir.nhs.uk/Id/nhs-number",
          "value": "9000000009",
          "extension": [
            {
              "url": "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-NHSNumberVerificationStatus",
              "valueCodeableConcept": {
                "coding": [
                  {
                    "system": "https://fhir.hl7.org.uk/CodeSystem/UKCore-NHSNumberVerificationStatus",
                    "version": "1.0.0",
                    "code": "01",
                    "display": "Number present and verified"
                  }
                ]
              }
            }
          ]
        }
      ],
      "meta": {
        "versionId": "2",
        "security": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/v3-Confidentiality",
            "code": "U",
            "display": "unrestricted"
          }
        ]
      },
      "name": [
        {
          "id": "123",
          "use": "usual",
          "period": {
            "start": "2020-01-01",
            "end": "2021-12-31"
          },
          "given": [
            "Jane"
          ],
          "family": "Smith",
          "prefix": [
            "Mrs"
          ],
          "suffix": [
            "MBE"
          ]
        }
      ],
      "gender": "female",
      "birthDate": "2010-10-22",
      "multipleBirthInteger": 1,
      "deceasedDateTime": "2010-10-22T00:00:00+00:00",
      "generalPractitioner": [
        {
          "id": "254406A3",
          "type": "Organization",
          "identifier": {
            "system": "https://fhir.nhs.uk/Id/ods-organization-code",
            "value": "Y12345",
            "period": {
              "start": "2020-01-01",
              "end": "2021-12-31"
            }
          }
        }
      ],
      "managingOrganization": {
        "type": "Organization",
        "identifier": {
          "system": "https://fhir.nhs.uk/Id/ods-organization-code",
          "value": "Y12345",
          "period": {
            "start": "2020-01-01",
            "end": "2021-12-31"
          }
        }
      },
      "extension": [
        {
          "url": "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-NominatedPharmacy",
          "valueReference": {
            "identifier": {
              "system": "https://fhir.nhs.uk/Id/ods-organization-code",
              "value": "Y12345"
            }
          }
        },
        {
          "url": "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-PreferredDispenserOrganization",
          "valueReference": {
            "identifier": {
              "system": "https://fhir.nhs.uk/Id/ods-organization-code",
              "value": "Y23456"
            }
          }
        },
        {
          "url": "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicalApplianceSupplier",
          "valueReference": {
            "identifier": {
              "system": "https://fhir.nhs.uk/Id/ods-organization-code",
              "value": "Y34567"
            }
          }
        },
        {
          "url": "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-DeathNotificationStatus",
          "extension": [
            {
              "url": "deathNotificationStatus",
              "valueCodeableConcept": {
                "coding": [
                  {
                    "system": "https://fhir.hl7.org.uk/CodeSystem/UKCore-DeathNotificationStatus",
                    "version": "1.0.0",
                    "code": "2",
                    "display": "Formal - death notice received from Registrar of Deaths"
                  }
                ]
              }
            },
            {
              "url": "systemEffectiveDate",
              "valueDateTime": "2010-10-22T00:00:00+00:00"
            }
          ]
        },
        {
          "url": "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-NHSCommunication",
          "extension": [
            {
              "url": "language",
              "valueCodeableConcept": {
                "coding": [
                  {
                    "system": "https://fhir.hl7.org.uk/CodeSystem/UKCore-HumanLanguage",
                    "version": "1.0.0",
                    "code": "fr",
                    "display": "French"
                  }
                ]
              }
            },
            {
              "url": "interpreterRequired",
              "valueBoolean": true
            }
          ]
        },
        {
          "url": "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-ContactPreference",
          "extension": [
            {
              "url": "PreferredWrittenCommunicationFormat",
              "valueCodeableConcept": {
                "coding": [
                  {
                    "system": "https://fhir.hl7.org.uk/CodeSystem/UKCore-PreferredWrittenCommunicationFormat",
                    "code": "12",
                    "display": "Braille"
                  }
                ]
              }
            },
            {
              "url": "PreferredContactMethod",
              "valueCodeableConcept": {
                "coding": [
                  {
                    "system": "https://fhir.hl7.org.uk/CodeSystem/UKCore-PreferredContactMethod",
                    "code": "1",
                    "display": "Letter"
                  }
                ]
              }
            },
            {
              "url": "PreferredContactTimes",
              "valueString": "Not after 7pm"
            }
          ]
        },
        {
          "url": "http://hl7.org/fhir/StructureDefinition/patient-birthPlace",
          "valueAddress": {
            "city": "Manchester",
            "district": "Greater Manchester",
            "country": "GBR"
          }
        }
      ],
      "telecom": [
        {
          "id": "789",
          "period": {
            "start": "2020-01-01",
            "end": "2021-12-31"
          },
          "system": "phone",
          "value": "01632960587",
          "use": "home"
        },
        {
          "id": "OC789",
          "period": {
            "start": "2020-01-01",
            "end": "2021-12-31"
          },
          "system": "other",
          "value": "01632960587",
          "use": "home",
          "extension": [
            {
              "url": "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-OtherContactSystem",
              "valueCoding": {
                "system": "https://fhir.hl7.org.uk/CodeSystem/UKCore-OtherContactSystem",
                "code": "textphone",
                "display": "Minicom (Textphone)"
              }
            }
          ]
        }
      ],
      "contact": [
        {
          "id": "C123",
          "period": {
            "start": "2020-01-01",
            "end": "2021-12-31"
          },
          "relationship": [
            {
              "coding": [
                {
                  "system": "http://terminology.hl7.org/CodeSystem/v2-0131",
                  "code": "C",
                  "display": "Emergency Contact"
                }
              ]
            }
          ],
          "telecom": [
            {
              "system": "phone",
              "value": "01632960587"
            }
          ]
        }
      ],
      "address": [
        {
          "id": "456",
          "period": {
            "start": "2020-01-01",
            "end": "2021-12-31"
          },
          "use": "home",
          "line": [
            "1 Trevelyan Square",
            "Boar Lane",
            "City Centre",
            "Leeds",
            "West Yorkshire"
          ],
          "postalCode": "LS1 6AE",
          "extension": [
            {
              "url": "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-AddressKey",
              "extension": [
                {
                  "url": "type",
                  "valueCoding": {
                    "system": "https://fhir.hl7.org.uk/CodeSystem/UKCore-AddressKeyType",
                    "code": "PAF"
                  }
                },
                {
                  "url": "value",
                  "valueString": "12345678"
                }
              ]
            }
          ]
        },
        {
          "id": "T456",
          "period": {
            "start": "2020-01-01",
            "end": "2021-12-31"
          },
          "use": "temp",
          "text": "Student Accommodation",
          "line": [
            "1 Trevelyan Square",
            "Boar Lane",
            "City Centre",
            "Leeds",
            "West Yorkshire"
          ],
          "postalCode": "LS1 6AE",
          "extension": [
            {
              "url": "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-AddressKey",
              "extension": [
                {
                  "url": "type",
                  "valueCoding": {
                    "system": "https://fhir.hl7.org.uk/CodeSystem/UKCore-AddressKeyType",
                    "code": "PAF"
                  }
                },
                {
                  "url": "value",
                  "valueString": "12345678"
                }
              ]
            }
          ]
        }
      ]
    })
  }

  async makePingRequest(): Promise<Ping> {
    const url = `${this.getBaseUrl()}/${this.getBasePath()}/_ping`
    return (await axios.get<Ping>(url)).data
  }

  protected async makeApiCall<T>(
    path: string
  ): Promise<AxiosResponse<T>> {
    const url = `${this.getBaseUrl()}/${this.getBasePath()}/${path}`
    return axios.request({
      url,
      method: "GET",
      headers: this.getHeaders(uuid.v4())
    })
  }

  protected getHeaders(requestId: string | undefined): AxiosRequestHeaders {
    return {
      "x-request-id": requestId ?? uuid.v4()
    }
  }

  protected getBaseUrl() {
    return "https://sandbox.api.service.nhs.uk"
  }

  protected getBasePath() {
    return `personal-demographics/FHIR/R4`
  }
}

// // Note derived classes cannot be in separate files due to circular reference issues with typescript
// // See these GitHub issues: https://github.com/Microsoft/TypeScript/issues/20361, #4149, #10712
class SandboxPdsClient extends PdsClient {
  constructor() {
    super()
  }
}

class LivePdsClient extends PdsClient {
  private accessToken: string

  constructor(accessToken: string) {
    super()
    this.accessToken = accessToken
  }

  async makeGetPatientRequest(nhsNumber: string): Promise<Patient | OperationOutcome> {
    return (await this.makeApiCall<Patient | OperationOutcome>(`Patient/${nhsNumber}`)).data
  }

  protected override getHeaders(requestId: string | undefined): AxiosRequestHeaders {
    return {
      "Authorization": `Bearer ${this.accessToken}`,
      "x-request-id": requestId ?? uuid.v4()
    }
  }

  protected override getBaseUrl() {
    return CONFIG.privateApigeeUrl
  }
}

export function getPdsClient(accessToken: string): PdsClient {
  return isInt(CONFIG.environment)
    ? new LivePdsClient(accessToken)
    : new SandboxPdsClient()
}

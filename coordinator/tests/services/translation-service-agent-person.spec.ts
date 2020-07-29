import * as translationService from "../../src/services/translation-service";
import {getAgentPersonTelecom} from "../../src/services/translation-service";
import * as codes from "../../src/services/hl7-v3-datatypes-codes";
import * as fhir from "../../src/services/fhir-resources";
import {ContactPoint} from "../../src/services/fhir-resources";
import * as core from "../../src/services/hl7-v3-datatypes-core";
import {TelecomUse} from "../../src/services/hl7-v3-datatypes-core";

describe('getAgentPersonTelecom', () => {
    const roleTelecom: Array<ContactPoint> = [
        {
            "system": "phone",
            "value": "tel:01512631737",
            "use": "work"
        }
    ]
    const practitionerTelecom: Array<ContactPoint> = [
        {
            "system": "phone",
            "value": "tel:01",
            "use": "work"
        }
    ]
    const roleTelecomExpected: Array<core.Telecom> = [
        {
            _attributes:
                {
                    "use": TelecomUse.WORKPLACE,
                    "value": "tel:01512631737"
                }
        }
    ]
    const practitionerTelecomExpected: Array<core.Telecom> = [
        {
            _attributes:
                {
                    "use": TelecomUse.WORKPLACE,
                    "value": "tel:01"
                }
        }
    ]

    test('if practitionerRole has telecom then we return that', () => {
        const output = getAgentPersonTelecom(roleTelecom, practitionerTelecom)
        expect(output).toEqual(roleTelecomExpected)
    })
    test('if practitionerRole has no telecom and practitioner has telecom then we return that', () => {
        const output = getAgentPersonTelecom(undefined, practitionerTelecom)
        expect(output).toEqual(practitionerTelecomExpected)
    })
    test('if neither practitionerRole or practitioner has telecom then we return undefined', () => {
        const output = getAgentPersonTelecom(undefined, undefined)
        expect(output).toEqual(undefined)
    })
})

describe('getAgentPersonPersonId', () => {
    const spuriousIdentifier: fhir.Identifier = {
        "system": "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
        "value": "spurious"
    }
    const dinIdentifier: fhir.Identifier = {
        "system": "https://fhir.hl7.org.uk/Id/din-number",
        "value": "din"
    }
    const userIdentifier: fhir.Identifier = {
        "system": "https://fhir.nhs.uk/Id/sds-user-id",
        "value": "8412511"
    }

    test('if all 3 codes are present we return spurious', () => {
        const output = translationService.getAgentPersonPersonId(
            [spuriousIdentifier], [dinIdentifier, userIdentifier]
        )
        expect(output).toEqual(new codes.BsaPrescribingIdentifier(spuriousIdentifier.value))
    })
    test('if spurious code is missing we return DIN', () => {
        const output = translationService.getAgentPersonPersonId(
            [], [dinIdentifier, userIdentifier]
        )
        expect(output).toEqual(new codes.BsaPrescribingIdentifier(dinIdentifier.value))
    })
    test('if spurious code and din are missing we return user', () => {
        const output = translationService.getAgentPersonPersonId(
            [], [userIdentifier]
        )
        expect(output).toEqual(new codes.SdsUniqueIdentifier(userIdentifier.value))
    })
    test('if all 3 are missing then throw', () => {
        expect(() => translationService.getAgentPersonPersonId(
            [], []
        )).toThrow()
    })
})

import {ContactPoint, Identifier} from "../../../src/model/fhir-resources";
import {Telecom, TelecomUse} from "../../../src/model/hl7-v3-datatypes-core";
import {getAgentPersonPersonId, getAgentPersonTelecom} from "../../../src/services/translation/practitioner";
import {BsaPrescribingIdentifier, SdsUniqueIdentifier} from "../../../src/model/hl7-v3-datatypes-codes";

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
    const roleTelecomExpected: Array<Telecom> = [
        {
            _attributes:
                {
                    "use": TelecomUse.WORKPLACE,
                    "value": "tel:01512631737"
                }
        }
    ]
    const practitionerTelecomExpected: Array<Telecom> = [
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
    const spuriousIdentifier: Identifier = {
        "system": "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
        "value": "spurious"
    }
    const dinIdentifier: Identifier = {
        "system": "https://fhir.hl7.org.uk/Id/din-number",
        "value": "din"
    }
    const userIdentifier: Identifier = {
        "system": "https://fhir.nhs.uk/Id/sds-user-id",
        "value": "8412511"
    }

    test('if all 3 codes are present we return spurious', () => {
        const output = getAgentPersonPersonId(
            [spuriousIdentifier], [dinIdentifier, userIdentifier]
        )
        expect(output).toEqual(new BsaPrescribingIdentifier(spuriousIdentifier.value))
    })
    test('if spurious code is missing we return DIN', () => {
        const output = getAgentPersonPersonId(
            [], [dinIdentifier, userIdentifier]
        )
        expect(output).toEqual(new BsaPrescribingIdentifier(dinIdentifier.value))
    })
    test('if spurious code and din are missing we return user', () => {
        const output = getAgentPersonPersonId(
            [], [userIdentifier]
        )
        expect(output).toEqual(new SdsUniqueIdentifier(userIdentifier.value))
    })
    test('if all 3 are missing then throw', () => {
        expect(() => getAgentPersonPersonId(
            [], []
        )).toThrow()
    })
})

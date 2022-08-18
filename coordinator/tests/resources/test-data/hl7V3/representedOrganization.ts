import {hl7V3} from "@models";

const healthcareProviderLicenseOrganization: hl7V3.Organization = {
    _attributes: {classCode: 'ORG', determinerCode: 'INSTANCE'},
    id: {
        _attributes: {root: '1.2.826.0.1285.0.1.10', extension: 'RRE'}
    },
    code: {
        _attributes: {
            codeSystem: '2.16.840.1.113883.2.1.3.2.4.17.94',
            code: '999',
            displayName: undefined
        }
    },
    name: {_text: 'MIDLANDS PARTNERSHIP NHS FOUNDATION TRUST'},

}

export const representedOrganization: hl7V3.Organization = {
    _attributes: {classCode: 'ORG', determinerCode: 'INSTANCE'},
    id: {
        _attributes: {root: '1.2.826.0.1285.0.1.10', extension: 'VNE51'}
    },
    code: {
        _attributes: {
            codeSystem: '2.16.840.1.113883.2.1.3.2.4.17.94',
            code: '999',
            displayName: undefined
        }
    },
    name: {_text: 'The Simple Pharmacy'},
    telecom: {_attributes: {use: hl7V3.TelecomUse.WORKPLACE, value: 'tel:01133180277'}},
    addr: {
        _attributes: {use: hl7V3.AddressUse.WORK},
        streetAddressLine: [
             { _text: '17 Austhorpe Road' },
             { _text: 'Crossgates' },
             { _text: 'Leeds' },
             { _text: 'West Yorkshire' }
          ],
        postalCode: {_text: 'LS15 8BA' }
        },
    healthCareProviderLicense:  {
        _attributes: {classCode: "PROV"},
        Organization: healthcareProviderLicenseOrganization
    }
}

import {hl7V3} from "@models";
import {agentPersonPerson} from "./agentPersonPerson";
import {representedOrganization} from "./representedOrganization";

export const agentPerson: hl7V3.AgentPerson = {
    _attributes: {classCode: 'AGNT'},
    id: {
        _attributes: {root: '1.2.826.0.1285.0.2.0.67', extension: '555086415105'}
    },
    code: {
        _attributes: {
            codeSystem: '1.2.826.0.1285.0.2.1.104',
            code: 'R8000',
            displayName: undefined
        }
    },
    telecom: [{_attributes: {use: hl7V3.TelecomUse.WORKPLACE, value: 'tel:02380798431'}}],
    agentPerson: agentPersonPerson,
    representedOrganization: representedOrganization
}
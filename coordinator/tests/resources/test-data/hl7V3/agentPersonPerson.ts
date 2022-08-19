import {hl7V3} from "@models"

export const agentPersonPerson: hl7V3.AgentPersonPerson = {
  _attributes: {classCode: "PSN", determinerCode: "INSTANCE"},
  id: {
    _attributes: {root: "1.2.826.0.1285.0.2.1.54", extension: "3415870201"}
  },
  name: {_attributes: {use: hl7V3.NameUse.PREFERRED}, _text: "Jackie Clark"}
}

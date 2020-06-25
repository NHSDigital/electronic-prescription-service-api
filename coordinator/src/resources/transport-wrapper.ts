import {ParentPrescription} from "../services/hl7-v3-prescriptions";
import {ElementCompact} from "xml-js";

export const wrap = function (payload: ParentPrescription): ElementCompact {
    return {
        "_declaration": {"_attributes": {"version": "1.0", "encoding": "UTF-8"}}, "PORX_IN020101UK31": {
            "_attributes": {"xmlns": "urn:hl7-org:v3"},
            "id": {"_attributes": {"root": "A7B86F8D-1DBD-FC28-E050-D20AE3A215F0"}},
            "creationTime": {"_attributes": {"value": "20200610102631"}},
            "versionCode": {"_attributes": {"code": "V3NPfIT3.0"}},
            "interactionId": {
                "_attributes": {
                    "extension": "PORX_IN020101UK31",
                    "root": "2.16.840.1.113883.2.1.3.2.4.12"
                }
            },
            "processingCode": {"_attributes": {"code": "P"}},
            "processingModeCode": {"_attributes": {"code": "T"}},
            "acceptAckCode": {"_attributes": {"code": "NE"}},
            "communicationFunctionRcv": {
                "device": {
                    "_attributes": {"classCode": "DEV", "determinerCode": "INSTANCE"},
                    "id": {"_attributes": {"extension": "000000000001", "root": "1.2.826.0.1285.0.2.0.107"}}
                }
            },
            "communicationFunctionSnd": {
                "device": {
                    "_attributes": {"classCode": "DEV", "determinerCode": "INSTANCE"},
                    "id": {"_attributes": {"extension": "000000000002", "root": "1.2.826.0.1285.0.2.0.107"}}
                }
            },
            "ControlActEvent": {
                "_attributes": {"classCode": "CACT", "moodCode": "EVN"},
                "author": {
                    "_attributes": {"typeCode": "AUT"},
                    "AgentPersonSDS": {
                        "_attributes": {"classCode": "AGNT"},
                        "id": {"_attributes": {"extension": "B0090,B0100,B1510", "root": "1.2.826.0.1285.0.2.0.67"}},
                        "agentPersonSDS": {
                            "_attributes": {"classCode": "PSN", "determinerCode": "INSTANCE"},
                            "id": {"_attributes": {"extension": "687227875014", "root": "1.2.826.0.1285.0.2.0.65"}}
                        },
                        "part": {
                            "_attributes": {"typeCode": "PART"},
                            "partSDSRole": {
                                "_attributes": {"classCode": "ROL"},
                                "id": {
                                    "_attributes": {
                                        "extension": "S0080:G0450:R5080",
                                        "root": "1.2.826.0.1285.0.2.1.104"
                                    }
                                }
                            }
                        }
                    }
                },
                "author1": {
                    "_attributes": {"typeCode": "AUT"},
                    "AgentSystemSDS": {
                        "_attributes": {"classCode": "AGNT"},
                        "agentSystemSDS": {
                            "_attributes": {"classCode": "DEV", "determinerCode": "INSTANCE"},
                            "id": {"_attributes": {"extension": "0000000003", "root": "1.2.826.0.1285.0.2.0.107"}}
                        }
                    }
                },
                "subject": {"ParentPrescription": payload}
            }
        }
    }
}

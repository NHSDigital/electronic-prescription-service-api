import {ElementCompact} from "xml-js";

class Code implements ElementCompact {
    _attributes: {
        codeSystem: string
        code: string
        displayName?: string
    }

    originalText?: string

    constructor(system: string, code: string, desc?: string) {
        this._attributes = {
            codeSystem: system,
            code: code,
            displayName: desc
        }
    }
}

export class SexCode extends Code {
    constructor(code: string) {
        super("2.16.840.1.113883.2.1.3.2.4.16.25", code);
    }

    static UNKNOWN = new SexCode("0")
    static MALE = new SexCode("1")
    static FEMALE = new SexCode("2")
    static INDETERMINATE = new SexCode("9")
}

export class PatientCareProvisionTypeCode extends Code {
    constructor(code: string) {
        super("2.16.840.1.113883.2.1.3.2.4.17.37", code);
    }
}

export class SnomedCode extends Code {
    constructor(code: string, desc: string) {
        super("2.16.840.1.113883.2.1.3.2.4.15", code, desc);
    }
}

export class SdsJobRoleCode extends Code {
    constructor(code: string) {
        super("1.2.826.0.1285.0.2.1.104", code);
    }
}

export class OrganizationTypeCode extends Code {
    constructor(code: string) {
        super("2.16.840.1.113883.2.1.3.2.4.17.94", code);
    }
}

export class PrescriptionAnnotationCode extends Code {
    constructor(code: string) {
        super("2.16.840.1.113883.2.1.3.2.4.17.30", code);
    }
}

export class PrescriptionTreatmentTypeCode extends Code {
    constructor(code: string) {
        super("2.16.840.1.113883.2.1.3.2.4.16.36", code);
    }
}

export class DispensingSitePreferenceCode extends Code {
    constructor(code: string) {
        super("2.16.840.1.113883.2.1.3.2.4.17.21", code);
    }
}

export class PrescriptionTypeCode extends Code {
    constructor(code: string) {
        super("2.16.840.1.113883.2.1.3.2.4.17.25", code);
    }
}

class Identifier implements ElementCompact {
    _attributes: {
        root: string
        extension?: string
    }

    constructor(root: string, extension?: string) {
        this._attributes = {
            root: root,
            extension: extension
        }
    }
}

export class GlobalIdentifier extends Identifier {
    constructor(root: string) {
        super(root);
    }
}

export class TypeIdentifier extends Identifier {
    constructor(extension: string) {
        super("2.16.840.1.113883.2.1.3.2.4.18.7", extension);
    }
}

export class TemplateIdentifier extends Identifier {
    constructor(extension: string) {
        super("2.16.840.1.113883.2.1.3.2.4.18.2", extension);
    }
}

export class NhsNumber extends Identifier {
    constructor(extension: string) {
        super("2.16.840.1.113883.2.1.4.1", extension);
    }
}

export class SdsUniqueIdentifier extends Identifier {
    constructor(extension: string) {
        super("1.2.826.0.1285.0.2.0.65", extension);
    }
}

export class SdsRoleProfileIdentifier extends Identifier {
    constructor(extension: string) {
        super("1.2.826.0.1285.0.2.0.67", extension);
    }
}

export class ShortFormPrescriptionIdentifier extends Identifier {
    constructor(extension: string) {
        super("2.16.840.1.113883.2.1.3.2.4.18.8", extension);
    }
}

export class SdsOrganizationIdentifier extends Identifier {
    constructor(extension: string) {
        super("1.2.826.0.1285.0.1.10", extension);
    }
}

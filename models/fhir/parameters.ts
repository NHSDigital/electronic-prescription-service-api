import * as common from "./common"

export type ParameterTypes = StringParameter |
  IdentifierParameter |
  CodeParameter |
  ReferenceParameter<any> |
  ResourceParameter |
  MultiPartParameter

export class Parameters extends common.Resource {
  readonly resourceType = "Parameters"
  parameter: Array<ParameterTypes>

  constructor(parameters: Array<ParameterTypes>) {
    super()
    this.parameter = parameters
  }
}

export interface Parameter {
  name: string
}

export interface ReferenceParameter<T extends common.Resource> extends Parameter {
  valueReference: common.IdentifierReference<T>
}

export interface ResourceParameter extends Parameter {
  resource: common.Resource
}

export interface MultiPartParameter extends Parameter {
  part: Array<Parameter>
}

export interface StringParameter extends Parameter {
  valueString: string
}

export interface IdentifierParameter extends Parameter {
  valueIdentifier: common.Identifier
}

interface CodeParameter extends Parameter {
  valueCode: string
}

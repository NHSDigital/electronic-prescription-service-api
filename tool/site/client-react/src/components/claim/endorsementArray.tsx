import * as React from "react"
import {FieldArrayRenderProps} from "formik/dist/FieldArray"
import {VALUE_SET_DISPENSER_ENDORSEMENT} from "./reference-data/valueSets"
import {getIn} from "formik"
import Endorsement from "./endorsement"
import {Button} from "nhsuk-react-components"
import {EndorsementFormValues} from "./claimForm"

const INITIAL_ENDORSEMENT_VALUES: EndorsementFormValues = {
  code: VALUE_SET_DISPENSER_ENDORSEMENT[0].code,
  supportingInfo: ""
}

const EndorsementArray: React.FC<FieldArrayRenderProps> = ({
  form,
  name,
  push,
  remove
}) => {
  const endorsements = getIn(form.values, name)
  return (
    <>
      {endorsements.map((endorsement, index) =>
        <Endorsement
          key={index}
          name={`${name}.${index}`}
          label={`Endorsement ${index + 1}`}
          removeEndorsement={() => remove(index)}
        />
      )}
      <div>
        <Button type="button" onClick={() => push(INITIAL_ENDORSEMENT_VALUES)}>Add Endorsement</Button>
      </div>
    </>
  )
}

export default EndorsementArray

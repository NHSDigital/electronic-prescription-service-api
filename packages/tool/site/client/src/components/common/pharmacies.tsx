import * as React from "react"
import {TextInput} from "nhsuk-react-components"
import {Field} from "formik"
import RadioField from "./radioField"

interface PharmacyProps {
  label: string
  defaultValue?: string
  value?: string
  error?: string
}

interface Pharmacy {
  odsCode: string
  name: string
}

const pharmacies: Array<Pharmacy> = [
  {
    odsCode: "VNFKT",
    name: "FIVE STAR HOMECARE LEEDS LTD"
  },
  {
    odsCode: "YGM1E",
    name: "MBBM HEALTHCARE TECHNOLOGIES LTD"
  }
]

const PharmacyRadios: React.FC<PharmacyProps> = ({
  label,
  defaultValue,
  value,
  error
}) => {
  return (
    <>
      <RadioField
        name="pharmacy"
        label={label}
        defaultValue={defaultValue}
        error={error}
        fieldRadios={[
          ...pharmacies.map((p, index) => {
            return {
              id: index,
              value: p.odsCode,
              text: `${p.odsCode} - ${p.name}`
            }
          }),
          {
            id: pharmacies.length,
            value: "custom",
            text: "Other"
          }
        ]}
      />
      {value === "custom" &&
          <Field
            id="customPharmacy"
            name="customPharmacy"
            as={TextInput}
            width={30}
            label="Enter an ODS Code"
          />
      }
    </>
  )
}

export default PharmacyRadios

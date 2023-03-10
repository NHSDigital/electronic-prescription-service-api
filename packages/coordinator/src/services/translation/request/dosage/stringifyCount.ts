import {fhir} from "@models"
import {isOne, isTwo, stringifyNumericValue} from "./utils"

export default /**
* TODO - implemented as per the guide but this doesn't combine very well with other elements
*/
function stringifyCount(dosage: fhir.Dosage): Array<string> {
  const repeat = dosage.timing?.repeat
  const count = repeat?.count
  const countMax = repeat?.countMax
  if (!count && !countMax) {
    return []
  }

  if (isOne(count) && !countMax) {
    return ["take once"]
  }

  if (isTwo(count) && !countMax) {
    return ["take twice"]
  }

  const elements = ["take ", stringifyNumericValue(count)]
  if (countMax) {
    elements.push(" to ", stringifyNumericValue(countMax))
  }
  elements.push(" times")
  return elements
}

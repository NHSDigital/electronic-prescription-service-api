import {isDeepStrictEqual} from "util"

export function getUniqueValues<T>(allValues: Array<T>): Array<T> {
  return allValues.reduce(
    (existingUniqueValues, valueToTest) => {
      if (existingUniqueValues.every((uniqueValue) => !isDeepStrictEqual(uniqueValue, valueToTest))) {
        return existingUniqueValues.concat(valueToTest)
      } else {
        return existingUniqueValues
      }
    },
    [allValues.shift()]
  )
}

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

export function groupBy<T, K>(list: Array<T>, getKey: (item: T) => K): Array<Array<T>> {
  const map = new Map<K, Array<T>>()
  list.forEach((item) => {
    const key = getKey(item)
    const collection = map.get(key)
    if (!collection) {
      map.set(key, [item])
    } else {
      collection.push(item)
    }
  })
  return Array.from(map.values())
}

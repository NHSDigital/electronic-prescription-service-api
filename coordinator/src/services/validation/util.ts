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

export function toMap<I, K, V>(
  iterable: Iterable<I>,
  keyExtractor: (item: I) => K,
  valueExtractor: (item: I) => V
): Map<K, Array<V>> {
  const map = new Map()
  for (const item of iterable) {
    const key = keyExtractor(item)
    const value = valueExtractor(item)
    const existingValues = map.get(key)
    if (existingValues) {
      existingValues.push(value)
    } else {
      map.set(key, [value])
    }
  }
  return map
}

export function groupBy<I, K>(iterable: Iterable<I>, keyExtractor: (item: I) => K): Map<K, Array<I>> {
  return toMap(iterable, keyExtractor, x => x)
}

export function getGroups<I, K>(list: Array<I>, keyExtractor: (item: I) => K): Array<Array<I>> {
  const map = groupBy(list, keyExtractor)
  return Array.from(map.values())
}

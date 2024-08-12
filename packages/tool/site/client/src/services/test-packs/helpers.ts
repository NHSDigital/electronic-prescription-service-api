// eslint-disable-next-line max-len
export function groupBy<TKey, TValue>(list: Array<TValue>, keyGetter: (item: TValue) => TKey): Map<TKey, Array<TValue>> {
  const map = new Map()
  list.forEach(item => {
    const key = keyGetter(item)
    const collection = map.get(key)
    if (!collection) {
      map.set(key, [item])
    } else {
      collection.push(item)
    }
  })
  return map
}

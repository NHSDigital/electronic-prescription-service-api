export function mergeState<S>(prevState: S, change: S | DeepPartial<S>): S {
  if (typeof change === "object") {
    const newState = Array.isArray(prevState) ? [...prevState] as unknown as S : {...prevState}
    Object.keys(change).forEach(key => newState[key] = mergeState(newState[key], change[key]))
    return newState
  }
  return change
}

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>
}

export function sparseArray<T>(index: number, value: T): Array<T> {
  const array: Array<T> = []
  array[index] = value
  return array
}

import * as React from "react"

export function createStateUpdater<T>(
  stateSetter: React.Dispatch<React.SetStateAction<T>>
): (newPartialState: DeepPartial<T>) => void {
  return (newPartialState: DeepPartial<T>) => stateSetter(prevState => mergeState(prevState, newPartialState))
}

export function mergeState<S>(prevState: S, newPartialState: S | DeepPartial<S>): S {
  if (typeof newPartialState === "object") {
    const newState = Array.isArray(prevState) ? [...prevState] as unknown as S : {...prevState}
    Object.keys(newPartialState).forEach(key => newState[key] = mergeState(newState[key], newPartialState[key]))
    return newState
  }
  return newPartialState
}

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>
}

export function sparseArray<T>(index: number, value: T): Array<T> {
  const array: Array<T> = []
  array[index] = value
  return array
}

import React, {ReactNode} from "react"
import {ChevronLeftIcon, ChevronRightIcon} from "nhsuk-react-components"
import styled from "styled-components"

export interface SortConfig<T> {
  key: keyof T
  ascending: boolean
}

export interface Sorter<T> {
  sortedItems: Array<T>
  sortBy: (key: keyof T) => void
  getIcon: (key: keyof T) => ReactNode
}

// eslint-disable-next-line  @typescript-eslint/no-unnecessary-type-constraint
export const useSorter = <T extends unknown>(items: Array<T>, config: SortConfig<T> = null): Sorter<T> => {
  const [sortConfig, setSortConfig] = React.useState<SortConfig<T>>(config)

  const sortedItems = React.useMemo(() => {
    const itemsCopy = [...items]
    if (sortConfig !== null) {
      itemsCopy.sort((a, b) => {
        const sortValueA = a[sortConfig.key]
        const sortValueB = b[sortConfig.key]
        const directionValue = sortConfig.ascending ? 1 : -1
        if (sortValueA > sortValueB) {
          return directionValue
        } else if (sortValueA < sortValueB) {
          return -directionValue
        } else {
          return 0
        }
      })
    }
    return itemsCopy
  }, [items, sortConfig])

  const sortBy = (key: keyof T) => {
    if (sortConfig && sortConfig.key === key) {
      setSortConfig({key, ascending: !sortConfig.ascending})
    } else {
      setSortConfig({key, ascending: true})
    }
  }

  const getIcon = (key: keyof T) => {
    if (sortConfig?.key !== key) {
      return null
    }
    return sortConfig.ascending ? <ChevronUpMini/> : <ChevronDownMini/>
  }

  return {sortedItems, sortBy, getIcon}
}

const ChevronUpMini = styled(ChevronLeftIcon)`
  transform: rotate(90deg);
  width: 1em;
  height: 1em;
`

const ChevronDownMini = styled(ChevronRightIcon)`
  transform: rotate(90deg);
  width: 1em;
  height: 1em;
`

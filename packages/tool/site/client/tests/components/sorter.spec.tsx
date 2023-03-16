import React from "react"
import {Table} from "nhsuk-react-components"
import {SortConfig, Sorter, useSorter} from "../../src/components/common/sorter"
import {render, screen, waitFor} from "@testing-library/react"
import pretty from "pretty"
import userEvent from "@testing-library/user-event"

interface TestItem {
  a: string
  b: Date
  c: number
}

const TestTable: React.FC<Sorter<TestItem>> = ({sortedItems, sortBy, getIcon}) => (
  <Table>
    <Table.Head>
      <Table.Row>
        <Table.Cell onClick={() => sortBy("a")}>{getIcon("a")}String</Table.Cell>
        <Table.Cell onClick={() => sortBy("b")}>{getIcon("b")}Date</Table.Cell>
        <Table.Cell onClick={() => sortBy("c")}>{getIcon("c")}Number</Table.Cell>
      </Table.Row>
    </Table.Head>
    <Table.Body>
      {sortedItems.map(item => (
        <Table.Row key={item.a}>
          <Table.Cell>{item.a}</Table.Cell>
          <Table.Cell>{item.b.toISOString()}</Table.Cell>
          <Table.Cell>{item.c}</Table.Cell>
        </Table.Row>
      ))}
    </Table.Body>
  </Table>
)

const item1 = {a: "testing", b: new Date("2021-06-05T09:30:00Z"), c: 42}
const item2 = {a: "also testing", b: new Date("2021-03-11T12:57:00Z"), c: 420}
const item3 = {a: "still testing", b: new Date("2021-07-28T04:05:00Z"), c: 4200}
const items: Array<TestItem> = [item1, item2, item3]

interface TestSortableTableProps{
  config?: SortConfig<TestItem>
}

describe("Table", () => {
  let sortedItemsRef: Array<TestItem>
  const TestSortableTable: React.FC<TestSortableTableProps> = ({config}) => {
    const sorter = useSorter<TestItem>(items, config)
    sortedItemsRef = sorter.sortedItems
    return <TestTable {...sorter}/>
  }

  test("Table renders without initial sort config", async () => {
    const {container} = render(<TestSortableTable/>)
    await waitFor(() => expect(sortedItemsRef).toEqual([item1, item2, item3]))
    expect(pretty(container.innerHTML)).toMatchSnapshot()
  })

  test("Table renders with initial sort config", async () => {
    const {container} = render(<TestSortableTable config={{key: "c", ascending: false}} />)
    await waitFor(() => expect(sortedItemsRef).toEqual([item3, item2, item1]))
    expect(pretty(container.innerHTML)).toMatchSnapshot()
  })

  test("Clicking a column header which is not the current sort key changes the sort key", async () => {
    const {container} = render(<TestSortableTable config={{key: "c", ascending: false}}/>)
    userEvent.click(await screen.findByText("Date"))
    await waitFor(() => expect(sortedItemsRef).toEqual([item2, item1, item3]))
    expect(pretty(container.innerHTML)).toMatchSnapshot()
  })

  test("Clicking a column header which is the current sort key toggles the sort direction", async () => {
    const {container} = render(<TestSortableTable config={{key: "c", ascending: false}}/>)
    userEvent.click(await screen.findByText("Date"))
    await waitFor(() => expect(sortedItemsRef).toEqual([item2, item1, item3]))
    userEvent.click(await screen.findByText("Date"))
    await waitFor(() => expect(sortedItemsRef).toEqual([item3, item1, item2]))
    expect(pretty(container.innerHTML)).toMatchSnapshot()
  })
})

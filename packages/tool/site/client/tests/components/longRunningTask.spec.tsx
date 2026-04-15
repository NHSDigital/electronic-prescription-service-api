import LongRunningTask from "../../src/components/common/longRunningTask"
import {render, screen} from "@testing-library/react"
import React from "react"
import userEvent from "@testing-library/user-event"
import {MemoryRouter} from "react-router-dom"

test("Shows loading message while task runs", async () => {
  const mockTask = vi.fn()
  mockTask.mockReturnValue(new Promise(vi.fn()))

  const ui = <LongRunningTask<Record<string, string>> task={mockTask} loadingMessage="Some loading message">
    {result => <span>{result.data}</span>}
  </LongRunningTask>
  const {container} = render(ui)

  await screen.findByText("Some loading message")
  expect(mockTask).toHaveBeenCalledTimes(1)
  expect(container.innerHTML).toMatchSnapshot()
})

test("Renders children if task resolves", async () => {
  const mockTask = vi.fn()
  mockTask.mockResolvedValue({data: "Some data from the backend"})

  const ui = <LongRunningTask<Record<string, string>> task={mockTask} loadingMessage="Loading">
    {result => <span>{result.data}</span>}
  </LongRunningTask>
  const {container} = render(ui)

  await screen.findByText("Some data from the backend")
  expect(mockTask).toHaveBeenCalledTimes(1)
  expect(container.innerHTML).toMatchSnapshot()
})

test.each([
  ["an error with a message", new Error("Some error message"), "Some error message"],
  ["an error without a message", new Error(), "Unknown error."],
  ["a string", "Some error message", "Some error message"],
  ["anything else", null, "Unknown error."]
])("Displays an error if task rejects with %s", async (desc: string, rejectedValue: unknown, expectedText: string) => {
  const mockTask = vi.fn()
  mockTask.mockRejectedValue(rejectedValue)

  const ui = <MemoryRouter>
    <LongRunningTask<Record<string, string>> task={mockTask} loadingMessage="Loading">
      {result => <span>{result.data}</span>}
    </LongRunningTask>
  </MemoryRouter>
  const {container} = render(ui)

  await screen.findByText(expectedText)
  expect(mockTask).toHaveBeenCalledTimes(1)
  expect(container.innerHTML).toMatchSnapshot()
})

test("Error page includes a back button with the provided onclick handler", async () => {
  const mockTask = vi.fn()
  mockTask.mockRejectedValue(new Error("Some error message"))
  const mockBack = vi.fn()

  const ui = (
    <MemoryRouter>
      <LongRunningTask<Record<string, string>> task={mockTask} loadingMessage="Loading" back={mockBack}>
        {result => <span>{result.data}</span>}
      </LongRunningTask>
    </MemoryRouter>
  )
  const {container} = render(ui)

  await screen.findByText("Some error message")
  expect(container.innerHTML).toMatchSnapshot()
  const button = await screen.findByText<HTMLButtonElement>("Back")
  await userEvent.click(button)
  expect(mockTask).toHaveBeenCalledTimes(1)
  expect(mockBack).toHaveBeenCalledTimes(1)
})

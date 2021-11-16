import LongRunningTask from "../../src/components/longRunningTask"
import {render, screen} from "@testing-library/react"
import React from "react"
import pretty from "pretty"
import userEvent from "@testing-library/user-event"

test("Shows loading message while task runs", async () => {
  const mockTask = jest.fn()
  mockTask.mockReturnValue(new Promise(jest.fn()))

  const ui = <LongRunningTask<Record<string, string>> task={mockTask} loadingMessage="Some loading message">
    {result => <span>{result.data}</span>}
  </LongRunningTask>
  const {container} = render(ui)

  await screen.findByText("Some loading message")
  expect(mockTask).toHaveBeenCalledTimes(1)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Renders children if task resolves", async () => {
  const mockTask = jest.fn()
  mockTask.mockResolvedValue({data: "Some data from the backend"})

  const ui = <LongRunningTask<Record<string, string>> task={mockTask} loadingMessage="Loading">
    {result => <span>{result.data}</span>}
  </LongRunningTask>
  const {container} = render(ui)

  await screen.findByText("Some data from the backend")
  expect(mockTask).toHaveBeenCalledTimes(1)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test.each([
  ["an error with a message", new Error("Some error message"), "Some error message"],
  ["an error without a message", new Error(), "Unknown error"],
  ["a string", "Some error message", "Some error message"],
  ["anything else", null, "Unknown error"]
])("Displays an error if task rejects with %s", async (desc: string, rejectedValue: unknown, expectedText: string) => {
  const mockTask = jest.fn()
  mockTask.mockRejectedValue(rejectedValue)

  const ui = <LongRunningTask<Record<string, string>> task={mockTask} loadingMessage="Loading">
    {result => <span>{result.data}</span>}
  </LongRunningTask>
  const {container} = render(ui)

  await screen.findByText(expectedText)
  expect(mockTask).toHaveBeenCalledTimes(1)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Error page includes a back button with the provided href", async () => {
  const mockTask = jest.fn()
  mockTask.mockRejectedValue(new Error("Some error message"))

  const ui = (
    <LongRunningTask<Record<string, string>> task={mockTask} loadingMessage="Loading" back="http://example.com/">
      {result => <span>{result.data}</span>}
    </LongRunningTask>
  )
  const {container} = render(ui)

  const linkButton = await screen.findByText<HTMLAnchorElement>("Back")
  expect(linkButton.href).toEqual("http://example.com/")
  expect(mockTask).toHaveBeenCalledTimes(1)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

test("Error page includes a back button with the provided onclick handler", async () => {
  const mockTask = jest.fn()
  mockTask.mockRejectedValue(new Error("Some error message"))
  const mockBack = jest.fn()

  const ui = (
    <LongRunningTask<Record<string, string>> task={mockTask} loadingMessage="Loading" back={mockBack}>
      {result => <span>{result.data}</span>}
    </LongRunningTask>
  )
  const {container} = render(ui)

  const button = await screen.findByText<HTMLButtonElement>("Back")
  userEvent.click(button)
  expect(mockTask).toHaveBeenCalledTimes(1)
  expect(mockBack).toHaveBeenCalledTimes(1)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

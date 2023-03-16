import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import * as React from "react"
import moxios from "moxios"
import userEvent from "@testing-library/user-event"
import pretty from "pretty"
import {readBundleFromFile} from "../messages"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import WithdrawPage from "../../src/pages/withdrawPage"
import {axiosInstance} from "../../src/requests/axiosInstance"
import {internalDev} from "../../src/services/environment"

const baseUrl = "baseUrl/"
const prescriptionId = "7A9089-A83008-56A03J"
const context: AppContextValue = {baseUrl, environment: internalDev}

const dispenseNotificationUrl = `${baseUrl}dispenseNotifications/${prescriptionId}`
const withdrawUrl = `${baseUrl}dispense/withdraw`

const dispenseNotification = readBundleFromFile("dispenseNotification.json")

describe("Withdraw Page", () => {
  beforeEach(() => {
    moxios.install(axiosInstance)
  })

  afterEach(() => {
    moxios.uninstall(axiosInstance)
  })

  const dispenseNotificationId = "76d1cc0b-bd64-4fad-a513-4de0f2ae7014"

  describe("When the page is loading the dispense notifications", () => {
    beforeEach(async () => {
      renderWithContext(<WithdrawPage prescriptionId={prescriptionId}/>, context)
    })

    it("should make a request to get the dispense notifications", () => {
      expect(moxios.requests.get("get", dispenseNotificationUrl)).toBeDefined()
    })

    it("should display the loading text", () => {
      expect(screen.getByText("Retrieving dispense notifications.")).toBeDefined()
    })

    it("should not display the withdraw form", () => {
      expect(screen.queryByText("Pharmacy withdrawing prescription")).toBeNull()
    })
  })

  describe("When there are zero dispense notifications", () => {
    beforeEach(async () => {
      moxios.stubRequest(dispenseNotificationUrl, {
        status: 200,
        response: []
      })

      renderWithContext(<WithdrawPage prescriptionId={prescriptionId}/>, context)
      await waitFor(() => screen.getByText("Withdraw Unavailable"))
    })

    it("should display the withdraw form", () => {
      expect(screen.getByText("Pharmacy withdrawing prescription")).toBeDefined()
    })

    it("should display an empty table", () => {
      expect(screen.getByText("None found.")).toBeDefined()
    })
  })

  describe("When there are two dispense notifications", () => {
    let container:HTMLElement
    beforeEach(async () => {
      moxios.stubRequest(dispenseNotificationUrl, {
        status: 200,
        response: [dispenseNotification, dispenseNotification]
      })

      container = renderWithContext(<WithdrawPage prescriptionId={prescriptionId}/>, context).container
      await waitFor(() => screen.getByText(`Withdrawing Dispense: ${dispenseNotificationId}`))
    })

    it("should display the withdraw form", () => {
      expect(screen.getByText("Pharmacy withdrawing prescription")).toBeDefined()
    })

    it("should display both dispense notifications", () => {
      expect(container.getElementsByClassName("nhsuk-expander").length).toBe(2)
    })

    it("should match the snapshot", () => {
      expect(pretty(container.innerHTML)).toMatchSnapshot()
    })
  })

  describe("When the dispense notification request fails", () => {
    beforeEach(async () => {
      moxios.stubRequest(dispenseNotificationUrl, {
        status: 500,
        statusText: "Internal Server Error",
        response: {}
      })

      renderWithContext(<WithdrawPage prescriptionId={prescriptionId}/>, context)
    })

    it("should display the error", () => {
      expect(screen.getByText("Error")).toBeDefined()
    })
  })

  describe("When the user submits the withdraw form successfully with two dispense notifications", () => {
    let container:HTMLElement
    beforeEach(async () => {
      moxios.stubRequest(dispenseNotificationUrl, {
        status: 200,
        response: [dispenseNotification, dispenseNotification]
      })

      moxios.stubRequest(withdrawUrl, {
        status: 200,
        response: {
          success: true,
          request: {req: "JSON Request"},
          request_xml: "XML Request",
          response: {res: "JSON Response"},
          response_xml: "XML Response"
        }
      })

      container = renderWithContext(<WithdrawPage prescriptionId={prescriptionId}/>, context).container
      await waitFor(() => screen.getByText(`Withdrawing Dispense: ${dispenseNotificationId}`))
      userEvent.click(screen.getByText("Withdraw"))
      await waitFor(() => screen.getByText("Withdraw Result"))
    })

    it("should display the first dispense notifications", () => {
      expect(screen.getByText("Event 1")).toBeDefined()
    })

    it("should not display the second dispense notifications", () => {
      expect(screen.queryByText("Event 2")).toBeNull()
    })

    it("should display the prescription actions including withdraw", () => {
      expect(screen.getByText("Withdraw prescription")).toBeDefined()
    })

    it("should match the snapshot", () => {
      expect(pretty(container.innerHTML)).toMatchSnapshot()
    })
  })

  describe("When the user submits the withdraw form successfully with one dispense notifications", () => {
    let container:HTMLElement
    beforeEach(async () => {
      moxios.stubRequest(dispenseNotificationUrl, {
        status: 200,
        response: [dispenseNotification]
      })

      moxios.stubRequest(withdrawUrl, {
        status: 200,
        response: {
          success: true,
          request: {req: "JSON Request"},
          request_xml: "XML Request",
          response: {res: "JSON Response"},
          response_xml: "XML Response"
        }
      })

      container = renderWithContext(<WithdrawPage prescriptionId={prescriptionId}/>, context).container
      await waitFor(() => screen.getByText(`Withdrawing Dispense: ${dispenseNotificationId}`))
      userEvent.click(screen.getByText("Withdraw"))
      await waitFor(() => screen.getByText("Withdraw Result"))
    })

    it("should not display the dispense notification table", () => {
      expect(screen.queryByText("Dispense Notifications")).toBeNull()
    })

    it("should display the prescription actions", () => {
      expect(screen.getByText("Dispense prescription")).toBeDefined()
    })

    it("should not display the withdraw prescription action", () => {
      expect(screen.queryByText("Withdraw prescription")).toBeNull()
    })

    it("should match the snapshot", () => {
      expect(pretty(container.innerHTML)).toMatchSnapshot()
    })
  })
})

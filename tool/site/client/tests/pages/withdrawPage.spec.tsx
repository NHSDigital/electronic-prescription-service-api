import {waitFor} from "@testing-library/react"
import {screen} from "@testing-library/dom"
import * as React from "react"
import moxios from "moxios"
import userEvent from "@testing-library/user-event"
import {readMessage} from "../messages/messages"
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

const dispenseNotification = readMessage("dispenseNotification.json")

describe("Withdraw Page", () => {
  beforeEach(() => {
    moxios.install(axiosInstance)
  })

  afterEach(() => {
    moxios.uninstall(axiosInstance)
  })

  describe("When the page is loading the dispense notifications", () => {
    beforeEach(async () => {
      renderWithContext(<WithdrawPage prescriptionId={prescriptionId}/>, context)
    })

    it("should make a request to get the dispense notifications", () => {
      expect(moxios.requests.get("get", dispenseNotificationUrl)).toBeDefined()
    })

    it("should display the loading text", () => {
      expect(screen.getByText("Loading...")).toBeDefined()
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
      await waitFor(() => screen.getByText("Withdraw prescription"))
    })

    it("should display the withdraw form", () => {
      expect(screen.getByText("Pharmacy withdrawing prescription")).toBeDefined()
    })

    it("should display an empty table", () => {
      expect(screen.getByText("None found.")).toBeDefined()
    })
  })

  describe("When there are two dispense notifications", () => {
    beforeEach(async () => {
      moxios.stubRequest(dispenseNotificationUrl, {
        status: 200,
        response: [dispenseNotification, dispenseNotification]
      })

      renderWithContext(<WithdrawPage prescriptionId={prescriptionId}/>, context).container
      await waitFor(() => screen.getByText("Withdraw prescription"))
    })

    it("should display the withdraw form", () => {
      expect(screen.getByText("Pharmacy withdrawing prescription")).toBeDefined()
    })

    it("should display both dispense notifications", () => {
      expect(screen.getAllByText("aef77afb-7e3c-427a-8657-2c427f71a271")).toHaveLength(2)
    })
  })

  describe("When the dispense notification request fails", () => {
    beforeEach(async () => {
      moxios.stubRequest(dispenseNotificationUrl, {
        status: 500,
        statusText: "Internal Server Error",
        response: {}
      })

      renderWithContext(<WithdrawPage prescriptionId={prescriptionId}/>, context).container
    })

    it("should display the error", () => {
      expect(screen.getByText("Error")).toBeDefined()
    })
  })

  describe("When the user submits the withdraw form successfully with two dispense notifications", () => {
    beforeEach(async () => {
      moxios.stubRequest(dispenseNotificationUrl, {
        status: 200,
        response: [dispenseNotification, dispenseNotification]
      })

      moxios.stubRequest(withdrawUrl, {
        status: 200,
        response: {
          success: true,
          request: "JSON Request",
          request_xml: "XML Request",
          response: "JSON Response",
          response_xml: "XML Response"
        }
      })

      renderWithContext(<WithdrawPage prescriptionId={prescriptionId}/>, context).container
      await waitFor(() => screen.getByText("Withdraw prescription"))
      userEvent.click(screen.getByText("Withdraw"))
      await waitFor(() => screen.getByText("Withdraw Result"))
    })

    it("should display one dispense notifications", () => {
      expect(screen.getAllByText("aef77afb-7e3c-427a-8657-2c427f71a271")).toHaveLength(1)
    })

    it("should display the prescription actions including withdraw", () => {
      expect(screen.getByText("Withdraw prescription")).toBeDefined()
    })
  })

  describe("When the user submits the withdraw form successfully with one dispense notifications", () => {
    beforeEach(async () => {
      renderWithContext(<WithdrawPage prescriptionId={prescriptionId}/>, context).container
      moxios.wait(() => {
        const request = moxios.requests.mostRecent()
        request.respondWith({status: 200, response: [dispenseNotification]})
      })

      await waitFor(() => screen.getByText("Withdraw prescription"))
      userEvent.click(screen.getByText("Withdraw"))
      moxios.wait(() => {
        const request = moxios.requests.mostRecent()
        request.respondWith({status: 200, response: [dispenseNotification]})
      })
      moxios.wait(() => {
        const request = moxios.requests.mostRecent()
        console.log(request)
        request.respondWith({
          status: 200,
          response: {
            success: true,
            request: "JSON Request",
            request_xml: "XML Request",
            response: "JSON Response",
            response_xml: "XML Response"
          }
        })
      })

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
  })
})

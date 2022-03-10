import {screen} from "@testing-library/dom"
import * as React from "react"
import moxios from "moxios"
import {AppContextValue} from "../../src"
import {renderWithContext} from "../renderWithContext"
import ViewPrescriptionPage from "../../src/pages/viewPrescriptionPage"
import {axiosInstance} from "../../src/requests/axiosInstance"
import {internalDev} from "../../src/services/environment"
import {readBundleFromFile} from "../messages"

const baseUrl = "baseUrl/"
const prescriptionId = "7A9089-A83008-56A03J"
const context: AppContextValue = {baseUrl, environment: internalDev}

const dispenseNotificationUrl = `${baseUrl}dispenseNotifications/${prescriptionId}`
const trackerUrl = `${baseUrl}tracker?focus%3Aidentifier=${prescriptionId}`

const detailSearchResult = readBundleFromFile("detailSearchResult.json")
const dispenseNotification = readBundleFromFile("dispenseNotification.json")

describe("Withdraw Page", () => {
  beforeEach(() => {
    moxios.install(axiosInstance)
  })

  afterEach(() => {
    moxios.uninstall(axiosInstance)
  })

  describe("When the page is loading the prescription details", () => {
    beforeEach(async () => {
      renderWithContext(<ViewPrescriptionPage prescriptionId={prescriptionId}/>, context)
    })

    it("should make a request to the tracker to get the prescription details", () => {
      console.log(moxios.requests)
      expect(moxios.requests.get("get", trackerUrl)).toBeDefined()
    })

    it("should display the loading text", () => {
      expect(screen.getByText("Loading...")).toBeDefined()
    })

    it("should not display the prescription details information", () => {
      expect(screen.queryByText("Prescription Details")).toBeNull()
    })
  })

  describe("When the page is loading dispense notifications for the prescription", () => {
    beforeEach(async () => {
      moxios.stubRequest(trackerUrl, {
        status: 200,
        response: detailSearchResult
      })

      renderWithContext(<ViewPrescriptionPage prescriptionId={prescriptionId}/>, context)
    })

    it("should make a request to the tracker to get the prescription details", () => {
      expect(moxios.requests.get("get", dispenseNotificationUrl)).toBeDefined()
    })

    it("should display the loading text", () => {
      expect(screen.getByText("Loading...")).toBeDefined()
    })

    it("should not display the prescription details information", () => {
      expect(screen.queryByText("Prescription Details")).toBeNull()
    })
  })

  describe("When the page fails to load the prescription details", () => {
    beforeEach(async () => {
      moxios.stubRequest(trackerUrl, {
        status: 500,
        statusText: "Internal Server Error",
        response: {}
      })
      moxios.stubRequest(dispenseNotificationUrl, {
        status: 500,
        statusText: "Internal Server Error",
        response: {}
      })

      renderWithContext(<ViewPrescriptionPage prescriptionId={prescriptionId}/>, context)
    })

    it("should display the error", () => {
      expect(screen.getByText("Error")).toBeDefined()
    })
  })

  describe("When the page loads a prescription with no dispense notifications", () => {
    beforeEach(async () => {
      moxios.stubRequest(trackerUrl, {
        status: 200,
        response: detailSearchResult
      })
      moxios.stubRequest(dispenseNotificationUrl, {
        status: 200,
        response: []
      })

      renderWithContext(<ViewPrescriptionPage prescriptionId={prescriptionId}/>, context)
    })

    it("should display the prescription details information", () => {
      expect(screen.getByText("Prescription Details")).toBeDefined()
    })

    it("should not display the dispense events table", () => {
      expect(screen.queryByText("Dispense Events")).toBeNull()
    })
  })

  describe("When the page loads a prescription with a dispense notification", () => {
    beforeEach(async () => {
      moxios.stubRequest(trackerUrl, {
        status: 200,
        response: detailSearchResult
      })
      moxios.stubRequest(dispenseNotificationUrl, {
        status: 200,
        response: [dispenseNotification]
      })

      renderWithContext(<ViewPrescriptionPage prescriptionId={prescriptionId}/>, context)
    })

    it("should display the prescription details information", () => {
      expect(screen.getByText("Prescription Details")).toBeDefined()
    })

    it("should display the dispense events table", () => {
      expect(screen.getByText("Dispense Events")).toBeDefined()
    })
  })
})

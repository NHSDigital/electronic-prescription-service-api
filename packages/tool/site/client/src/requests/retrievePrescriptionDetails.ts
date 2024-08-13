/* eslint-disable max-len */
import {axiosInstance} from "./axiosInstance"
import * as fhir from "fhir/r4"
import {getResponseDataIfValid} from "./getValidResponse"
import {getArrayTypeGuard, isBundle} from "../fhir/typeGuards"

export async function getPrescriptionOrderMessage(baseUrl: string, prescriptionId: string): Promise<fhir.Bundle> {
  const prescriptionOrderResponse = await axiosInstance.get<fhir.Bundle>(`${baseUrl}dispense/release/${prescriptionId}`)
  return getResponseDataIfValid(prescriptionOrderResponse, isBundle)
}

export async function getDispenseNotificationMessages(baseUrl: string, prescriptionId: string): Promise<Array<fhir.Bundle>> {
  const dispenseNotificationsResponse = await axiosInstance.get<Array<fhir.Bundle>>(`${baseUrl}dispenseNotifications/${prescriptionId}`)
  return getResponseDataIfValid(dispenseNotificationsResponse, getArrayTypeGuard(isBundle))
}

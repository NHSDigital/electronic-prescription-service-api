import * as postPrescription from './prescription/post-convert-full-message'
import * as putPrescription from './prescription/post-convert-signature-fragments'
import * as postSendPrescription from './prescription/post-send-message'
import * as health from './health/get-health'

export const routes = [...postPrescription.routes, ...putPrescription.routes, ...postSendPrescription.routes, ...health.routes]

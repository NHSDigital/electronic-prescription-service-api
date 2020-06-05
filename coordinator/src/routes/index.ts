import * as postPrescription from './prescription/post-convert-full-message'
import * as putPrescription from './prescription/post-convert-signature-fragments'
import * as health from './health/get-health'

export const routes = [].concat(postPrescription.routes, putPrescription.routes, health.routes);

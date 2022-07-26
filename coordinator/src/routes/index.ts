import convertPrescriptionRoutes from "./debug/convert"
import validatorRoutes from "./debug/validate"
import doseToTextRoutes from "./debug/dose-to-text"
import preparePrescriptionRoutes from "./prescribe/prepare"
import processPrescriptionRoutes from "./process"
import statusRoutes from "./health/get-status"
import metadataRoutes from "./metadata"
import pollingRoutes from "./polling"
import releaseRoutes from "./dispense/release"
import taskRoutes from "./dispense/task"
import claimRoutes from "./dispense/claim"
import trackerRoutes from "./tracker/task"
import spineTrackerRoutes from "./tracker/tracker"
import verifySignatureRoutes from "./dispense/verify-signature"
import {isInternalDev, isProd} from "../utils/environment"

const internalDevRoutes = [
  // todo: AEA-2361 move to ptlRoutes once we have sorted ASIDs
  ...spineTrackerRoutes
]

const ptlRoutes = [
  ...convertPrescriptionRoutes,
  ...validatorRoutes,
  ...doseToTextRoutes
]

const mainRoutes = [
  ...preparePrescriptionRoutes,
  ...processPrescriptionRoutes,
  ...releaseRoutes,
  ...pollingRoutes,
  ...taskRoutes,
  ...claimRoutes,
  ...trackerRoutes,
  ...verifySignatureRoutes,
  ...metadataRoutes
]

const healthcheckRoutes = [
  ...statusRoutes
]

const routes = [
  ...healthcheckRoutes,
  ...mainRoutes
]

if (isInternalDev()) {
  routes.push(...internalDevRoutes)
}

if (!isProd()) {
  routes.push(...ptlRoutes)
}

export default routes

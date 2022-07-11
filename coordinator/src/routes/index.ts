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
import trackerSpikeRoutes from "./tracker/spike"
import verifySignatureRoutes from "./dispense/verify-signature"
import {isProd} from "../utils/environment"

const ptlRoutes = [
  ...convertPrescriptionRoutes,
  ...validatorRoutes,
  ...doseToTextRoutes,
  ...trackerSpikeRoutes
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

if (!isProd()) {
  routes.push(...ptlRoutes)
}

export default routes

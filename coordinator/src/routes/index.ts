import convertPrescriptionRoutes from "./debug/convert"
import validatorRoutes from "./debug/validate"
import preparePrescriptionRoutes from "./prescribe/prepare"
import processPrescriptionRoutes from "./process"
import statusRoutes from "./health/get-status"
import pollingRoutes from "./prescribe/polling"
import releaseRoutes from "./dispense/release"
import taskRoutes from "./dispense/task"

export default [
  ...convertPrescriptionRoutes,
  ...validatorRoutes,
  ...preparePrescriptionRoutes,
  ...processPrescriptionRoutes,
  ...releaseRoutes,
  ...statusRoutes,
  ...pollingRoutes,
  ...taskRoutes
]

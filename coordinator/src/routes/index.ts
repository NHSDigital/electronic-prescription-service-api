import convertPrescriptionRoutes from "./prescription/post-convert-message"
import preparePrescriptionRoutes from "./prescription/post-prepare-message"
import processPrescriptionRoutes from "./prescription/post-process-message"
import statusRoutes from "./health/get-status"
import pollingRoutes from "./prescription/polling"
import releaseRoutes from "./dispention/release"

export default [
  ...convertPrescriptionRoutes,
  ...preparePrescriptionRoutes,
  ...processPrescriptionRoutes,
  ...releaseRoutes,
  ...statusRoutes,
  ...pollingRoutes
]

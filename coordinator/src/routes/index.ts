import convertPrescriptionRoutes from "./prescription/post-convert-message"
import preparePrescriptionRoutes from "./prescription/post-prepare-message"
import processPrescriptionRoutes from "./prescription/post-process-message"
import statusRoutes from "./health/get-status"
import metricRoutes from "./health/get-metrics"
import pollingRoutes from "./prescription/polling"

export default [
  ...convertPrescriptionRoutes,
  ...preparePrescriptionRoutes,
  ...processPrescriptionRoutes,
  ...statusRoutes,
  ...metricRoutes,
  ...pollingRoutes
]

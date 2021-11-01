import * as moment from "moment"

export function formatDate(date?: string): string {
  return moment.utc(date).format("DD-MMM-YYYY")
}

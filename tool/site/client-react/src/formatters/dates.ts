import {utc} from "moment"

export function formatDate(date: string): string {
  return utc(date).format("DD-MMM-YYYY")
}

import * as moment from "moment"

export function formatDate(date: string): string {
  return moment.utc(date).format("DD-MMM-YYYY")
}

export function formatCurrentDate(): string {
  return moment.utc().format("DD-MMM-YYYY")
}

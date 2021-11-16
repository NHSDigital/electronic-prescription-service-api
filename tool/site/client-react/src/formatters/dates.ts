import * as moment from "moment"

export function formatDate(date: string): string {
  return formatMomentAsDate(moment.utc(date))
}

export function formatMomentAsDate(date: moment.Moment): string {
  return date.format("DD-MMM-YYYY")
}

export function formatCurrentDate(): string {
  return moment.utc().format("DD-MMM-YYYY")
}

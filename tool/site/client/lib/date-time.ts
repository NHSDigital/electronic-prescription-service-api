import moment from "moment"

// eslint-disable-next-line max-len
// eslint-disable-next-line max-len
const ISO_DATE_FORMAT = "YYYY-MM-DD"
const ISO_DATE_TIME_FORMAT = "YYYY-MM-DD[T]HH:mm:ssZ"

export function convertMomentToISODateTime(moment: moment.Moment): string {
  return moment.format(ISO_DATE_TIME_FORMAT)
}

export function convertMomentToISODate(moment: moment.Moment): string {
  return moment.format(ISO_DATE_FORMAT)
}

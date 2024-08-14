// eslint-disable-next-line no-undef
export function getSummaryListKeyValueMap(container: HTMLElement): Record<string, string> {
  const summaryMap: Record<string, string> = {}
  container.querySelectorAll(".nhsuk-summary-list__row").forEach(row => {
    const key = row.querySelector(".nhsuk-summary-list__key").innerHTML
    summaryMap[key] = row.querySelector(".nhsuk-summary-list__value").innerHTML
  })
  return summaryMap
}

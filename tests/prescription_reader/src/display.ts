export function getPrescription(): string {
  return getElement<HTMLInputElement>("#prescription-textarea").value
}

export function getElement<T>(selectors: string): T {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return document.querySelector(selectors)! as unknown as T
}

export function showDisplay(prescription: string): void {
  resetError()
  getElement<HTMLDivElement>("#display-value").innerHTML = prescription
  getElement<HTMLAnchorElement>("#display-container").style.display = "block"
  getElement<HTMLAnchorElement>("#prescription-container").style.display = "none"
  getElement<HTMLDivElement>("#reset-button").style.display = "inline-block"
  getElement<HTMLDivElement>("#read-button").style.display = "none"
  getElement<HTMLDivElement>("#compare-button").style.display = "inline-block"
}

export function showCompare(): void {
  resetError()
  resetDisplay()
}

export function resetCompare(): void {
  getElement<HTMLDivElement>("#display-value").innerHTML = ""
  getElement<HTMLDivElement>("#compare-button").style.display = "none"
}

export function showError(description: string, details?: string): void {
  getElement<HTMLDivElement>("#error-description").innerText = description
  if (details) {
    getElement<HTMLDivElement>("#error-details").innerText = details
  }
  getElement<HTMLDivElement>("#error-container").style.display = "block"
}

export function resetError(): void {
  getElement<HTMLDivElement>("#error-description").innerText = ""
  getElement<HTMLDivElement>("#error-details").innerText = ""
  getElement<HTMLDivElement>("#error-container").style.display = "none"
}

export function resetDisplay(): void {
  getElement<HTMLDivElement>("#display-container").style.display = "none"
  getElement<HTMLDivElement>("#prescription-container").style.display = "block"
  getElement<HTMLDivElement>("#reset-button").style.display = "none"
  getElement<HTMLDivElement>("#read-button").style.display = "inline-block"
  getElement<HTMLDivElement>("#compare-button").style.display = "none"
  getElement<HTMLInputElement>("#prescription-textarea").value = ""
  resetError()
}

export function resetAll(): void {
  resetError()
  resetDisplay()
  resetCompare()
}
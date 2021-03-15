import {getElement, showCompare} from "./display"
import {read, reset} from "./read"

export function attachListeners(): void {
  getElement<HTMLButtonElement>("#read-button").addEventListener("click", read)
  getElement<HTMLButtonElement>("#compare-button").addEventListener("click", showCompare)
  getElement<HTMLButtonElement>("#reset-button").addEventListener("click", reset)
}

// Because the JS is loaded at the end of the DOM, we know its safe to start running this now
window.addEventListener("DOMContentLoaded", () => {
  attachListeners()
})
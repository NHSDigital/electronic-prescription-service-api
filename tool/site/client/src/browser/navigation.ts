export function redirect(url: string): void {
  window.location.assign(url)
}

export interface Redirect {
  redirectUri: string
}

export function makeRequest(method: string, url: string, body?: unknown): any {
  const uri = encodeURI(url)
  const xmlhttp = new XMLHttpRequest()
  xmlhttp.onload = function() {
    if (this.status === 302) {
      var location = this.getResponseHeader("Location")
      window.location.href = location
      return
    }
    if (this.status === 200) {
      return JSON.parse(this.responseText)
    }
  }
  xmlhttp.withCredentials = true
  xmlhttp.open(method, uri, false)
  xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
  xmlhttp.send(body as any)
}

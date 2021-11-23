export function makeRequest(method: string, url: string, body?: unknown): any {
  const uri = encodeURI(url)
  const xmlhttp = new XMLHttpRequest()
  xmlhttp.onreadystatechange = function() {
    if (this.readyState !== 4) {
      return
    }
    if (this.status === 302) {
      var location = this.getResponseHeader("Location")
      window.location.href = location
      return
    } 
    return JSON.parse(this.responseText)
  }
  xmlhttp.withCredentials = true
  xmlhttp.open(method, uri, false)
  xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
  xmlhttp.send(body as any)
}

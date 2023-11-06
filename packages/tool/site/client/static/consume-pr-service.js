/* eslint-disable func-style */
import {PRService} from "./pr-service.js"

var loadScriptFileAtRunTime = function () {
  let scriptSourcePath = ""
  let onErrorCallBack = undefined
  let onSuccessCallBack = undefined

  this.load = function (_scriptSourcePath, successCallBack, errorCallBack) {
    onErrorCallBack = errorCallBack
    onSuccessCallBack = successCallBack
    scriptSourcePath = _scriptSourcePath
    var _scriptElement = document.createElement("script")
    _scriptElement.onload = handleLoad
    _scriptElement.onerror = handleError
    _scriptElement.src = scriptSourcePath
    document.body.appendChild(_scriptElement)
  }

  function handleLoad() {
    callMethod(onSuccessCallBack)
  }

  function handleError() {
    console.log("Error occured while loading the script file path : " + scriptSourcePath)
    callMethod(onErrorCallBack)
  }

  //Invokes the method based on the delegations.
  function callMethod(func) {
    // eslint-disable-next-line eqeqeq
    if (func != undefined) {
      func()
    }
  }
}

jQuery(function() {
  window.prService = new PRService()
  window.prService.initialize(PRSuccessCallBack, errorCallBack)
})

function PRSuccessCallBack(data, args) {
  if (loadScriptFileAtRunTime !== undefined) {
    var _loadScriptFileAtRunTime = new loadScriptFileAtRunTime()
    _loadScriptFileAtRunTime.load("http://localhost:" + data + "/signalr/hubs", callBackHubLoad, callBackHubLoadError)
  }
}

function callBackHubLoadError() {
  if (callBackHubLoad !== undefined) {
    callBackHubLoad()
  }
}

function errorCallBack(data, args) {
  console.log("PR Service returned with following exception code " + args.Code + " and message " + args.Message)
  if (callBackHubLoad !== undefined) {
    callBackHubLoad()
  }
}

//empty method so that the function can be overloaded on specific pages.
function callBackHubLoad() {
  console.log("CallBackHubLoad was called from the consumerprservice.js file, override this function to perform required funcationality.")
}

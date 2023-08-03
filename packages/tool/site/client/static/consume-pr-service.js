/* eslint-disable func-style */
import {PRService} from "./pr-service.js"

var loadScriptFileAtRunTime = function () {
  scriptSourcePath = ""
  onErrorCallBack = undefined
  onSuccessCallBack = undefined

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

  handleLoad = function () {
    callMethod(onSuccessCallBack)
  }

  handleError = function () {
    console.log("Error occured while loading the script file path : " + scriptSourcePath)
    callMethod(onErrorCallBack)
  }

  //Invokes the method based on the delegations.
  callMethod = function (func) {
    if (func !== undefined) {
      func()
    }
  }
}

jQuery(function() {
  var prService = new PRService()
  prService.initialize(PRSuccessCallBack, errorCallBack)
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

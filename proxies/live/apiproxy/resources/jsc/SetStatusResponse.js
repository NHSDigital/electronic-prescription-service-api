// These values are rendered by pipeline's template step
var version = "{{ DEPLOYED_VERSION }}"
var releaseId = "{{ RELEASE_RELEASEID }}"
var commitId = "{{ SOURCE_COMMIT_ID }}"

var apiproxy_revision = context.getVariable('apiproxy.revision');

var healthcheck_service_response_code = context.getVariable('healthcheckResponse.status.code');
var healthcheck_service_response = context.getVariable('healthcheckResponse.content');
var healthcheck_service_request_url = context.getVariable('healthcheckRequest.url');

var healthcheck_service_request_has_failed = context.getVariable("servicecallout.ServiceCallout.CallHealthcheckEndpoint.failed");

var healthcheck_service_status = "fail";

if(healthcheck_service_response_code/ 100 == 2){
  healthcheck_service_status = "pass";
}

timeout = "false";

if(healthcheck_service_response_code === null && healthcheck_service_request_has_failed){
  timeout = "true";
}

var healthcheck_service = {
  "healthcheckService:status" : [
    {
      "status": healthcheck_service_status,
      "timeout" : timeout,
      "responseCode" : healthcheck_service_response_code,
      "outcome": healthcheck_service_response,
      "links" : {"self": healthcheck_service_request_url}
    }]
};

var apigee_status = "pass";

if(healthcheck_service_status != "pass"){
  apigee_status = "fail";
}

var response = {
  "status" : apigee_status,
  "version" : version ,
  "revision" : apiproxy_revision,
  "releaseId" : releaseId,
  "commitId": commitId,
  "checks" : healthcheck_service
};

context.setVariable("status.response", JSON.stringify(response));
context.setVariable("response.content", JSON.stringify(response));
context.setVariable("response.header.Content-Type", "application/json");

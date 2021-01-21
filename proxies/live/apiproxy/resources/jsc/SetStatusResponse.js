response = JSON.parse(context.getVariable("response.content"))
health = response.validator && response.coordinator
status = health ? "pass" : "failure"
context.setVariable("health.total", status)
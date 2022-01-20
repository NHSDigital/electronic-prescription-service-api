import flask
import config

def render_rivets_client():
    return flask.render_template(
        "client.html",
        environment=config.ENVIRONMENT,
        public_apigee_url=config.PUBLIC_APIGEE_URL,
        base_url=config.BASE_URL
    )


def render_react_client():
    return flask.render_template(
        "client_v2.html",
        base_url=config.BASE_URL
   )
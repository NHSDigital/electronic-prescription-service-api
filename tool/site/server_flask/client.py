import flask
import config

def render_client(page_mode, sign_response=None, send_response=None, release_response=None):
    return flask.render_template(
        "client.html",
        page_mode=page_mode,
        environment=config.ENVIRONMENT,
        public_apigee_url=config.PUBLIC_APIGEE_URL,
        base_url=config.BASE_URL,
        sign_response=sign_response,
        send_response=send_response,
        release_response=release_response,
    )

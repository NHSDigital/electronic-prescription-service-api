import base64
import json
import config


def get_oauth_base_path(auth_method, public):
    apigee_url = config.PUBLIC_APIGEE_URL if public else f"https://{config.APIGEE_DOMAIN_NAME}"
    if auth_method == "simulated" and config.ENVIRONMENT == "int":
        return f"{apigee_url}/oauth2-no-smartcard"
    else:
        return f"{apigee_url}/oauth2"


def get_registered_callback_url():
  if pr_redirect_enabled(config.ENVIRONMENT):
    return f'{config.PUBLIC_APIGEE_URL}/eps-api-tool/callback'
  else:
    return f'{config.PUBLIC_APIGEE_URL}/{config.BASE_PATH}/callback'


def pr_redirect_enabled(environment):
  return environment == "internal-dev"


def pr_redirect_required(base_path, state):
  if "prNumber" not in state:
    return False
  request_pr_number = state["prNumber"]
  return request_pr_number != get_pr_number(base_path)


def get_pr_number(base_path):
  if not base_path.startswith("eps-api-tool-pr-"):
    return None
  pr_number_str = base_path.partition("eps-api-tool-pr-")[2]
  return int(pr_number_str)


def get_pr_branch_url(request_pr_number, endpoint, query_string):
  return f'https://internal-dev.api.service.nhs.uk/eps-api-tool-pr-{request_pr_number}/{endpoint}?{query_string}'


def create_oauth_state(pr_number, page_mode):
    state_obj = {"pageMode": page_mode}
    if pr_number is not None:
        state_obj["prNumber"] = pr_number
    state = json.dumps(state_obj)
    return base64.b64encode(state.encode("utf-8")).decode("utf-8")


def parse_oauth_state(state):
    decoded_state = base64.b64decode(state.encode("utf-8")).decode("utf-8")
    return json.loads(decoded_state)

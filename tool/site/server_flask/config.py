import os

SESSION_TOKEN_ENCRYPTION_KEY = os.environ["SESSION_TOKEN_ENCRYPTION_KEY"].encode("utf-8")
ENVIRONMENT = os.environ.get("ENVIRONMENT", "prod")
PUBLIC_APIGEE_URL = os.environ["PUBLIC_APIGEE_URL"]
BASE_PATH = os.environ.get("BASE_PATH")
if BASE_PATH is None:
  BASE_URL = "/"
else:
  BASE_URL = f'/{os.environ["BASE_PATH"]}/'
STATIC_URL = f'/static'
DEV_MODE = os.environ.get("DEV_MODE", False)
DEMO_APP_CLIENT_ID = os.environ.get("DEMO_APP_CLIENT_ID")
DEMO_APP_CLIENT_KEY = os.environ.get("DEMO_APP_CLIENT_KEY")
APIGEE_DOMAIN_NAME = os.environ["APIGEE_DOMAIN_NAME"]

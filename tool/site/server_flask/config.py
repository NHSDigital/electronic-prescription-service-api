import os

SESSION_TOKEN_ENCRYPTION_KEY = os.environ["SESSION_TOKEN_ENCRYPTION_KEY"].encode("utf-8")
REDIS_URL = os.environ["REDIS_URL"]
ENVIRONMENT = os.environ.get("ENVIRONMENT", "prod")
PUBLIC_APIGEE_URL = os.environ["PUBLIC_APIGEE_URL"]
BASE_PATH = os.environ.get("BASE_PATH")
if BASE_PATH is None:
  BASE_URL = "/"
else:
  BASE_URL = f'/{BASE_PATH}/'
STATIC_URL = f'/static'
DEV_MODE = os.environ.get("DEV_MODE", False)
DEMO_APP_CLIENT_ID = os.environ.get("DEMO_APP_CLIENT_ID")
DEMO_APP_CLIENT_KEY = os.environ.get("DEMO_APP_CLIENT_KEY")
APIGEE_DOMAIN_NAME = os.environ["APIGEE_DOMAIN_NAME"]
# patch for RSS support whilst requirements for local signing and RSS are different
# todo: use same private key for remote and local signing
DEMO_APP_KEY_ID = os.environ.get("DEMO_APP_KEY_ID")
DEMO_APP_LOCAL_SIGNING_PRIVATE_KEY = os.environ.get("DEMO_APP_PRIVATE_KEY")
DEMO_APP_REMOTE_SIGNING_PRIVATE_KEY = os.environ.get("RSS_JWT_PRIVATE_KEY")
APP_SIGNING_SUBJECT = os.environ.get("APP_SIGNING_SUBJECT")
DEMO_APP_REMOTE_SIGNING_ISSUER = os.environ.get("RSS_JWT_ISSUER")
DEMO_APP_REMOTE_SIGNING_KID = os.environ.get("RSS_JWT_KID")

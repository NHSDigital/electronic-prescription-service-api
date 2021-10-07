from cryptography.fernet import Fernet
from flask import Flask
from flask_compress import Compress
import config
from flask_session import Session
import redis

fernet = Fernet(config.SESSION_TOKEN_ENCRYPTION_KEY)
compress = Compress()


def create_app():
    app = Flask(__name__, static_url_path=config.STATIC_URL)
    compress.init_app(app)
    app.config.from_mapping(
        SECRET_KEY=config.SESSION_TOKEN_ENCRYPTION_KEY,
        SESSION_TYPE="redis",
        SESSION_REDIS=redis.from_url(config.REDIS_URL),
        JSON_SORT_KEYS=False
    )
    Session(app)

    return app


app = create_app()

from routes import *

if __name__ == "__main__":
    app.run(debug=config.DEV_MODE, port=9000)

from cryptography.fernet import Fernet
from flask import Flask
from flask_compress import Compress
import config

fernet = Fernet(config.SESSION_TOKEN_ENCRYPTION_KEY)
compress = Compress()


def create_app():
    app = Flask(__name__, static_url_path=config.STATIC_URL)
    compress.init_app(app)
    app.config.from_mapping(
        SECRET_KEY=config.SESSION_TOKEN_ENCRYPTION_KEY,
        JSON_SORT_KEYS=False
    )
    return app


app = create_app()

from routes import *

if __name__ == "__main__":
    app.run(debug=config.DEV_MODE)

from dotenv import load_dotenv
import os
import binascii
from cryptography.fernet import Fernet

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

ENCRYPTION_KEY = bytes.fromhex(
    os.getenv("ENCRYPTION_KEY", binascii.hexlify(os.urandom(32)).decode())
)
ENCRYPTION_NONCE = bytes.fromhex(
    os.getenv("ENCRYPTION_NONCE", binascii.hexlify(os.urandom(12)).decode())
)
SERVER_ENCRYPTION_KEY = os.getenv(
    "SERVER_ENCRYPTION_KEY", Fernet.generate_key().decode()
).encode()
CLIENT_SERVER_SECRET = os.getenv("CLIENT_SERVER_SECRET")
API_URL = os.getenv("API_URL")
CLIENT_LOG_FILE = os.getenv("CLIENT_LOG_FILE")
CLIENT_SECRETS_FILE = os.getenv("CLIENT_SECRETS_FILE")
OAUTH_SCOPES = os.getenv("OAUTH_SCOPES", "").split(" ")
DEBUG_LOGS = os.getenv("DEBUG_LOGS")
UPLOADS_FOLDER = os.getenv("UPLOADS_FOLDER")
SIMULATIONS_FOLDER = os.getenv("SIMULATIONS_FOLDER")
FLASK_SIMULATIONS_FOLDER = os.getenv("FLASK_SIMULATIONS_FOLDER", "")
UPLOAD_QUEUE_SERVICE_URL = os.getenv("UPLOAD_QUEUE_SERVICE_URL")
CLIENT_SERVER_API_KEY = os.getenv("CLIENT_SERVER_API_KEY")
UPLOAD_QUEUE_SERVICE_API_KEY = os.getenv("UPLOAD_QUEUE_SERVICE_API_KEY")
USER_SERVICES_API_KEY = os.getenv("USER_SERVICES_API_KEY")
ADMIN_SERVICES_API_KEY = os.getenv("ADMIN_SERVICES_API_KEY")
MANIFEST_FILENAME = os.getenv("MANIFEST_FILENAME", "")
EXTERNAL_API_KEY = os.getenv("EXTERNAL_API_KEY")
ADMIN_HTML = os.getenv("ADMIN_HTML", "")
ADMIN_JS_FOLDER = os.getenv("ADMIN_JS_FOLDER", "")
JS_FOLDER = os.getenv("JS_FOLDER", "")
IMG_FOLDER = os.getenv("IMG_FOLDER", "")
ADMIN_CSS_FOLDER = os.getenv("ADMIN_CSS_FOLDER", "")
CSS_FOLDER = os.getenv("CSS_FOLDER", "")
RESOURCE_FOLDER = os.getenv("RESOURCE_FOLDER", "")
CONF_FILE = os.getenv("CONF_FILE", "")

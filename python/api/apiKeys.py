from dotenv import load_dotenv
import os
import binascii
from cryptography.fernet import Fernet

load_dotenv()

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
LOG_FILE = os.getenv("LOG_FILE")
CLIENT_SECRETS_FILE = os.getenv("CLIENT_SECRETS_FILE")
OAUTH_SCOPES = os.getenv("OAUTH_SCOPES", "").split(" ")
DEBUG_LOGS = os.getenv("DEBUG_LOGS")
UPLOADS_FOLDER = os.getenv("UPLOADS_FOLDER")
SIMULATIONS_FOLDER = os.getenv("SIMULATIONS_FOLDER")

from dotenv import load_dotenv
import os
import binascii
from cryptography.fernet import Fernet

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

AES_ENCRYPTION_KEY = bytes.fromhex(
    os.getenv("AES_ENCRYPTION_KEY", binascii.hexlify(os.urandom(32)).decode())
)
AES_ENCRYPTION_NONCE = bytes.fromhex(
    os.getenv("AES_ENCRYPTION_NONCE", binascii.hexlify(os.urandom(12)).decode())
)
FERNET_ENCRYPTION_KEY = os.getenv(
    "FERNET_ENCRYPTION_KEY", Fernet.generate_key().decode()
).encode()
DB_LOG_FILE = os.getenv("LOG_FILE")
DB_DEBUG_LOGS = os.getenv("DEBUG_LOGS")
UPLOADS_FOLDER = os.getenv("UPLOADS_FOLDER")
SIMULATIONS_FOLDER = os.getenv("SIMULATIONS_FOLDER")
USER_SERVICES_API_KEY = os.getenv("USER_SERVICES_API_KEY")
CLIENT_SERVER_API_KEY = os.getenv("CLIENT_SERVER_API_KEY")
ADMIN_SERVICES_API_KEY = os.getenv("ADMIN_SERVICES_API_ACCESS_KEY")
CLIENT_SERVER_API_KEYS = [
    USER_SERVICES_API_KEY,
    CLIENT_SERVER_API_KEY,
    ADMIN_SERVICES_API_KEY,
]

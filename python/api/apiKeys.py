from dotenv import load_dotenv
import os
import binascii

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

AES_ENCRYPTION_KEY = bytes.fromhex(
    os.getenv("AES_ENCRYPTION_KEY", binascii.hexlify(os.urandom(32)).decode())
)
AES_ENCRYPTION_NONCE = bytes.fromhex(
    os.getenv("AES_ENCRYPTION_NONCE", binascii.hexlify(os.urandom(12)).decode())
)
CATALOG_API_AES_ENCRYPTION_KEY = bytes.fromhex(
    os.getenv(
        "CATALOG_API_AES_ENCRYPTION_KEY", binascii.hexlify(os.urandom(32)).decode()
    )
)
CATALOG_API_AES_ENCRYPTION_NONCE = bytes.fromhex(
    os.getenv(
        "CATALOG_API_AES_ENCRYPTION_NONCE", binascii.hexlify(os.urandom(12)).decode()
    )
)
PNG_URL_AES_ENCRYPTION_KEY = bytes.fromhex(
    os.getenv("PNG_URL_AES_ENCRYPTION_KEY", binascii.hexlify(os.urandom(32)).decode())
)
PNG_URL_AES_ENCRYPTION_NONCE = bytes.fromhex(
    os.getenv("PNG_URL_AES_ENCRYPTION_KEY", binascii.hexlify(os.urandom(12)).decode())
)
MANIFEST_FILENAME = os.getenv("MANIFEST_FILENAME", "")
CATALOG_FILENAME = os.getenv("CATALOG_FILENAME", "")
DB_LOG_FILE = os.getenv("DB_LOG_FILE", "")
DB_DEBUG_LOGS = os.getenv("DB_DEBUG_LOGS")
DB_INSTANCE = os.getenv("DB_INSTANCE")
UPLOADS_FOLDER = os.getenv("UPLOADS_FOLDER")
SIMULATIONS_FOLDER = os.getenv("SIMULATIONS_FOLDER")
TEMP_FOLDER = os.getenv("TEMP_FOLDER", "")
USER_SERVICES_API_KEY = os.getenv("USER_SERVICES_API_KEY")
CLIENT_SERVER_API_KEY = os.getenv("CLIENT_SERVER_API_KEY")
ADMIN_SERVICES_API_KEY = os.getenv("ADMIN_SERVICES_API_KEY")
UPLOAD_SERVICE_API_KEY = os.getenv("UPLOAD_SERVICE_API_KEY")
UPLOAD_WORKER_API_KEY = os.getenv("UPLOAD_WORKER_API_KEY")
CLIENT_SERVER_API_KEYS = [
    USER_SERVICES_API_KEY,
    CLIENT_SERVER_API_KEY,
    ADMIN_SERVICES_API_KEY,
]
UPLOAD_API_KEYS = [
    ADMIN_SERVICES_API_KEY,
    UPLOAD_SERVICE_API_KEY,
    UPLOAD_WORKER_API_KEY,
]
USER_SERVICES_KEYS = [USER_SERVICES_API_KEY, ADMIN_SERVICES_API_KEY]

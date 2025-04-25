from dotenv import load_dotenv
import os
import binascii
from cryptography.fernet import Fernet

load_dotenv()

API_SECRET = os.getenv("API_SECRET")
AES_ENCRYPTION_KEY = bytes.fromhex(
    os.getenv("AES_ENCRYPTION_KEY", binascii.hexlify(os.urandom(32)).decode())
)
AES_ENCRYPTION_NONCE = bytes.fromhex(
    os.getenv("AES_ENCRYPTION_NONCE", binascii.hexlify(os.urandom(12)).decode())
)
FERNET_ENCRYPTION_KEY = os.getenv(
    "FERNET_ENCRYPTION_KEY", Fernet.generate_key().decode()
).encode()

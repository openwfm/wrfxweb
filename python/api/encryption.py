from api.apiKeys import AES_ENCRYPTION_KEY, AES_ENCRYPTION_NONCE, FERNET_ENCRYPTION_KEY

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.fernet import Fernet


aesgcm = AESGCM(AES_ENCRYPTION_KEY)
fernet = Fernet(FERNET_ENCRYPTION_KEY)


def encrypt_user_data(user_data):
    encrypted_column_data = aesgcm.encrypt(
        AES_ENCRYPTION_NONCE, user_data.encode(), b""
    )
    return encrypted_column_data


def decrypt_user_data(encrypted_user_data):
    return aesgcm.decrypt(AES_ENCRYPTION_NONCE, encrypted_user_data, b"").decode()

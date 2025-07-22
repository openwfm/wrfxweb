from api.apiKeys import (
    AES_ENCRYPTION_KEY,
    AES_ENCRYPTION_NONCE,
    FERNET_ENCRYPTION_KEY,
    CATALOG_API_AES_ENCRYPTION_KEY,
    CATALOG_API_AES_ENCRYPTION_NONCE,
    PNG_URL_AES_ENCRYPTION_KEY,
    PNG_URL_AES_ENCRYPTION_NONCE,
)
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.fernet import Fernet


aesgcm = AESGCM(AES_ENCRYPTION_KEY)
aesgcm_catalog = AESGCM(CATALOG_API_AES_ENCRYPTION_KEY)
aesgcm_png_url = AESGCM(PNG_URL_AES_ENCRYPTION_KEY)

fernet = Fernet(FERNET_ENCRYPTION_KEY)


def encrypt_user_data(user_data):
    encrypted_column_data = aesgcm.encrypt(
        AES_ENCRYPTION_NONCE, user_data.encode(), b""
    )
    return encrypted_column_data


def decrypt_user_data(encrypted_user_data):
    return aesgcm.decrypt(AES_ENCRYPTION_NONCE, encrypted_user_data, b"").decode()


def encrypt_searchable_data(searchable_data):
    encrypted_column_data = aesgcm.encrypt(
        AES_ENCRYPTION_NONCE, searchable_data.encode(), b""
    )
    return encrypted_column_data


def decrypt_searchable_data(encrypted_searchable_data):
    return aesgcm.decrypt(AES_ENCRYPTION_NONCE, encrypted_searchable_data, b"").decode()


def encrypt_api_key(api_key):
    encrypted_api_key = aesgcm_catalog.encrypt(
        CATALOG_API_AES_ENCRYPTION_NONCE, api_key.encode(), b""
    )
    return encrypted_api_key


def decrypt_api_key(encrypted_api_key):
    return aesgcm_catalog.decrypt(
        CATALOG_API_AES_ENCRYPTION_NONCE, encrypted_api_key, b""
    ).decode()


def encrypt_png_url(png_url):
    encrypted_png_url = aesgcm_png_url.encrypt(
        PNG_URL_AES_ENCRYPTION_NONCE, png_url.encode(), b""
    )
    return encrypted_png_url


def decrypt_png_url(encrypted_png_url):
    return aesgcm_png_url.decrypt(
        PNG_URL_AES_ENCRYPTION_NONCE, encrypted_png_url, b""
    ).decode()

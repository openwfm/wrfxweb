from api.validators.utils import sanitize_text
import api.encryption as encryption


def serialize_catalog_api_key(catalog_api_key):
    return {
        "id": sanitize_text(f"{catalog_api_key.id}"),
        "api_key": sanitize_text(
            encryption.decrypt_api_key(catalog_api_key.encrypted_api_key)
        ),
        "catalog_id": sanitize_text(f"{catalog_api_key.catalog_id}"),
        "date_created": sanitize_text(catalog_api_key.date_created),
    }

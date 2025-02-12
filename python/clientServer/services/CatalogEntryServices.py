from clientServer.app import db, aesgcm
from clientServer.models.CatalogEntry import CatalogEntry
from clientServer.serverKeys import ENCRYPTION_NONCE


# catalog_entry_params: {
#     "catalog_id": catalog_id,
#     "zip_file": zip_file,
#     "save_path": sanitized_save_path,
#     "unzip_path": sanitized_unzip_path,
#     "uploader_id": current_user.id,
#     "name": zip_file_name,
# }
def create(catalog_entry_params):
    zip_file = catalog_entry_params["zip_file"]
    save_path = catalog_entry_params["save_path"]
    zip_file.save(save_path)

    encrypted_unzip_path = aesgcm.encrypt(
        ENCRYPTION_NONCE, catalog_entry_params["unzip_path"].encode(), b""
    )

    catalog_entry = CatalogEntry(
        catalog_id=catalog_entry_params["catalog_id"],
        name=catalog_entry_params["name"],
        uploader_id=catalog_entry_params["uploader_id"],
        encrypted_entry_path=encrypted_unzip_path,
    )

    db.session.add(catalog_entry)
    db.session.commit()
    return catalog_entry


def destroy(catalog_id, catalog_entry_id):
    pass


def destroy_all(catalog_id):
    pass


def find_by_id(catalog_id, catalog_entry_id):
    pass


def find_all(catalog_id):
    pass

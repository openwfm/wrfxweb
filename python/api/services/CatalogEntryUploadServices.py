from api.db import db
from api.models.CatalogEntryUpload import CatalogEntryUpload


# catalog_entry_upload_params {
#        "catalog": catalog,
#        "zip_file": zip_file,
#        "uploader_id": current_user.id,
#        "entry_type": entry_type,
#    }
def create(catalog_entry_upload_params):
    zip_file = catalog_entry_upload_params["zip_file"]

    catalog_entry_upload = CatalogEntryUpload(
        catalog_id=catalog_entry_upload_params["catalog_id"],
        uploader_id=catalog_entry_upload_params["uploader_id"],
        entry_type=catalog_entry_upload_params["entry_type"],
    )

    db.session.add(catalog_entry_upload)
    db.session.commit()

    zip_file.save(catalog_entry_upload.upload_path())

    return catalog_entry_upload


def destroy(catalog_id, catalog_entry_id):
    pass


def destroy_all(catalog_id):
    pass


def find_by_id(catalog_id, catalog_entry_id):
    pass


def find_all(catalog_id):
    pass

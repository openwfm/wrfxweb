from api.db import db
from api.models.CatalogEntryUpload import CatalogEntryUpload
from api.validators import CatalogEntryUploadValidators as CatalogEntryUploadValidators


# catalog_entry_upload_params {
#        "catalog": catalog,
#        "zip_file": zip_file,
#        "uploader_id": current_user.id,
#        "entry_type": entry_type,
#    }
def create(json):
    try:
        catalog_entry_upload_params = CatalogEntryUploadValidators.validate_create_json(
            json
        )

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
    except Exception:
        return None


def destroy(catalog_id, catalog_entry_id):
    pass


def destroy_all(catalog_id):
    pass


def find_by_id(catalog_entry_upload_id):
    try:
        validated_catalog_entry_upload_id = CatalogEntryUploadValidators.validate_id(
            catalog_entry_upload_id
        )
        return CatalogEntryUpload.query.get(validated_catalog_entry_upload_id)
    except Exception:
        return None


def find_all(catalog_id):
    pass

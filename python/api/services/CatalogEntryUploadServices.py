from api.session import db_session
import api.encryption as encryption
from api.models.catalogEntryUpload.CatalogEntryUpload import CatalogEntryUpload
from api.validators import CatalogEntryUploadValidators as CatalogEntryUploadValidators
from api.validators import utils as validationUtils
from api.apiKeys import UPLOAD_API_KEYS

import api.logging.utils as logging


# catalog_entry_upload_params {
#        "catalog": catalog,
#        "zip_file": zip_file,
#        "uploader_id": current_user.id,
#        "entry_type": entry_type,
#    }
def create(json, upload_api_key):
    try:
        if upload_api_key not in UPLOAD_API_KEYS:
            raise PermissionError("Invalid UploadApiKey")
        catalog_entry_upload_params = CatalogEntryUploadValidators.validate_create_json(
            json
        )

        zip_file = catalog_entry_upload_params["zip_file"]
        zip_filename = validationUtils.validate_filename(zip_file.filename)
        encrypted_filename = encryption.encrypt_searchable_data(zip_filename)

        catalog_entry_upload = CatalogEntryUpload(
            uploader_id=catalog_entry_upload_params["uploader_id"],
            entry_type=catalog_entry_upload_params["entry_type"],
            zip_filename=encrypted_filename,
        )

        db_session.add(catalog_entry_upload)
        db_session.commit()

        zip_file.save(catalog_entry_upload.upload_path())

        return catalog_entry_upload
    except Exception as e:
        logging.service_exception("CatalogEntryUpload", "create", e)
        return None


def find_by_id(catalog_entry_upload_id):
    try:
        validated_catalog_entry_upload_id = CatalogEntryUploadValidators.validate_id(
            catalog_entry_upload_id
        )
        return db_session.query(CatalogEntryUpload).get(
            validated_catalog_entry_upload_id
        )
    except Exception as e:
        logging.service_exception("CatalogEntryUpload", "find", e)
        return None

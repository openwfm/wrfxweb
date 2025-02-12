from clientServer.validators import CatalogValidators as CatalogValidators
from clientServer.validators import utils as validatorUtils
from clientServer.serverKeys import ADMIN_UPLOADS_FOLDER, SIMULATIONS_FOLDER

from flask_login import current_user
import os


def validate_catalog_entry(json):
    if "catalog_id" not in json:
        raise ValueError("catalog_id is required")
    if "zip_file" not in json:
        raise ValueError("zip_file is required")

    catalog = CatalogValidators.validate_catalog(json["catalog_id"])
    catalog_folder = catalog.catalog_folder()

    zip_file = validatorUtils.validate_zip(json["zip_file"])
    zip_file_name = validatorUtils.sanitize_path(zip_file.filename)
    save_path = f"{ADMIN_UPLOADS_FOLDER}/{catalog_folder}/{zip_file_name}"
    unzip_path = (
        f"{SIMULATIONS_FOLDER}/{catalog_folder}/{os.path.splitext(zip_file_name)[0]}"
    )

    return {
        "catalog_id": catalog.id,
        "zip_file": zip_file,
        "save_path": save_path,
        "unzip_path": unzip_path,
        "uploader_id": current_user.id,
        "name": zip_file_name,
    }

from clientServer.validators import CatalogValidators as CatalogValidators
from clientServer.validators import utils as validationUtils
from clientServer.serverKeys import SIMULATIONS_FOLDER

from flask_login import current_user


# uploader_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
# catalog_id = db.Column(db.Integer, db.ForeignKey("catalog.id"))
# user = db.relationship("User", foreign_keys="CatalogEntryUpload.uploader_id")
# entry_type = db.Column(db.String(255), nullable=False)
def validate_catalog_entry_upload(json):
    if "catalog_id" not in json:
        raise ValueError("catalog_id is required")
    if "zip_file" not in json:
        raise ValueError("zip_file is required")
    if "entry_type" not in json:
        raise ValueError("entry_type is required")

    catalog_id = CatalogValidators.validate_catalog_id(json["catalog_id"])
    zip_file = validationUtils.validate_zip(json["zip_file"])
    entry_type = validationUtils.validate_text(json["entry_type"])

    return {
        "catalog_id": catalog_id,
        "zip_file": zip_file,
        "uploader_id": current_user.id,
        "entry_type": entry_type,
    }

from api.validators import CatalogValidators as CatalogValidators
from api.validators import UserValidators as UserValidators
from api.validators import utils as validationUtils


# uploader_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
# catalog_id = db.Column(db.Integer, db.ForeignKey("catalog.id"))
# user = db.relationship("User", foreign_keys="CatalogEntryUpload.uploader_id")
# entry_type = db.Column(db.String(255), nullable=False)
def validate_create_json(json):
    if "catalog_id" not in json:
        raise ValueError("catalog_id is required")
    if "zip_file" not in json:
        raise ValueError("zip_file is required")
    if "entry_type" not in json:
        raise ValueError("entry_type is required")
    if "uploader_id" not in json:
        raise ValueError("uploader_id is required")

    catalog_id = CatalogValidators.validate_catalog_id(json["catalog_id"])
    uploader_id = UserValidators.validate_user_id(json["uploader_id"])
    zip_file = validationUtils.validate_zip(json["zip_file"])
    entry_type = validationUtils.validate_text(json["entry_type"])

    return {
        "catalog_id": catalog_id,
        "zip_file": zip_file,
        "uploader_id": uploader_id,
        "entry_type": entry_type,
    }


def validate_id(catalog_entry_upload_id):
    if type(catalog_entry_upload_id) is int:
        return catalog_entry_upload_id
    if type(catalog_entry_upload_id) is str:
        if not catalog_entry_upload_id.isdigit():
            raise ValueError("catalog_id must be an integer")
        return int(catalog_entry_upload_id)
    else:
        raise ValueError("catalog_id must be an integer")

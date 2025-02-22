from api.validators import CatalogValidators as CatalogValidators
from api.validators import UserValidators as UserValidators
from api.validators import utils as validationUtils


# uploader_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
# catalog_id = db.Column(db.Integer, db.ForeignKey("catalog.id"))
# user = db.relationship("User", foreign_keys="CatalogEntryUpload.uploader_id")
# entry_type = db.Column(db.String(255), nullable=False)
def validate_create_json(json):
    print(f"json: {json}")
    if "job_id" not in json:
        raise ValueError("job_id is required")
    if "uploader_id" not in json:
        raise ValueError("uploader_id is required")
    if "entry_type" not in json:
        raise ValueError("entry_type is required")
    if "catalog_id" not in json:
        raise ValueError("catalog_id is required")
    if "description" not in json:
        raise ValueError("description is required")
    if "to_utc" not in json:
        raise ValueError("to_utc is required")
    if "from_utc" not in json:
        raise ValueError("from_utc is required")
    if "manifest_path" not in json:
        raise ValueError("manifest_path is required")

    job_id = validationUtils.validate_text(json["job_id"])
    uploader_id = UserValidators.validate_user_id(json["uploader_id"])
    entry_type = validationUtils.validate_text(json["entry_type"])
    catalog_id = CatalogValidators.validate_catalog_id(json["catalog_id"])
    description = validationUtils.validate_text(json["description"])
    to_utc = validationUtils.validate_text(json["to_utc"])
    from_utc = validationUtils.validate_text(json["from_utc"])
    manifest_path = validationUtils.validate_text(json["manifest_path"])

    zip_size = validationUtils.validate_text(json["zip_size"])
    kml_size = validationUtils.validate_text(json["kml_size"])
    processed_utc = validationUtils.validate_text(json["processed_utc"])
    run_utc = validationUtils.validate_text(json["run_utc"])
    zip_url = validationUtils.validate_text(json["zip_url"])
    kml_url = validationUtils.validate_text(json["kml_url"])

    return {
        "job_id": job_id,
        "uploader_id": uploader_id,
        "entry_type": entry_type,
        "catalog_id": catalog_id,
        "description": description,
        "to_utc": to_utc,
        "from_utc": from_utc,
        "manifest_path": manifest_path,
        "zip_size": zip_size,
        "kml_size": kml_size,
        "processed_utc": processed_utc,
        "run_utc": run_utc,
        "zip_url": zip_url,
        "kml_url": kml_url,
    }


def validate_id(catalog_entry_id):
    if type(catalog_entry_id) is int:
        return catalog_entry_id
    if type(catalog_entry_id) is str:
        if not catalog_entry_id.isdigit():
            raise ValueError("catalog_entry_id must be an integer")
        return int(catalog_entry_id)
    else:
        raise ValueError("catalog_entry_id must be an integer")

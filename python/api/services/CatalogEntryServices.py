from api.db import db
from api.models.CatalogEntry import CatalogEntry
from api.validators import CatalogEntryValidators as CatalogEntryValidators


# catalog_entry_upload_params {
#        "catalog": catalog,
#        "zip_file": zip_file,
#        "uploader_id": current_user.id,
#        "entry_type": entry_type,
#    }
def create(json):
    try:
        catalog_entry_params = CatalogEntryValidators.validate_create_json(json)

        catalog_entry = CatalogEntry(catalog_entry_params)

        db.session.add(catalog_entry)
        db.session.commit()

    except:
        return None


def destroy(catalog_id, catalog_entry_id):
    pass


def destroy_all(catalog_id):
    pass


def find_by_id(catalog_entry_id):
    try:
        validated_catalog_entry_upload_id = CatalogEntryValidators.validate_id(
            catalog_entry_id
        )
        return CatalogEntry.query.get(validated_catalog_entry_upload_id)
    except Exception:
        return None


def find_all(catalog_id):
    pass

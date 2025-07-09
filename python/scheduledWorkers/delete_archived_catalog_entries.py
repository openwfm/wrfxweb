from api.session import db_session
from api.models.catalogEntry.CatalogEntry import CatalogEntry
import api.services.CatalogEntryServices as CatalogEntryServices
from scheduledWorkers.workerKeys import UPLOAD_WORKER_API_KEY


def delete_archived_catalog_entries():
    archived_catalog_entries = (
        db_session.query(CatalogEntry).filter_by(archived=True).all()
    )
    for catalog_entry in archived_catalog_entries:
        CatalogEntryServices.delete_by_id(catalog_entry.id, UPLOAD_WORKER_API_KEY)


if __name__ == "__main__":
    delete_archived_catalog_entries()

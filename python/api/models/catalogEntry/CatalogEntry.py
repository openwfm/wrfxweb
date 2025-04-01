from api.session import db_session
from api.models.User import User
from api.models.catalogEntry.CatalogEntryDbModel import CatalogEntryDbModel
from api.apiKeys import SIMULATIONS_FOLDER
import api.encryption as encryption


class CatalogEntry(CatalogEntryDbModel):
    def entry_path(self):
        entry_path = (
            f"{SIMULATIONS_FOLDER}/{encryption.decrypt_searchable_data(self.job_id)}"
        )
        return entry_path

    def entry_manifest_path(self):
        manifest_path = f"{SIMULATIONS_FOLDER}/{encryption.decrypt_searchable_data(self.manifest_path)}"
        return manifest_path

    def uploader(self):
        if self.uploader_id == None or self.uploader_id < 1:
            return None
        return User.query.get(self.uploader_id)

    def directory(self):
        return SIMULATIONS_FOLDER

    def folder_name(self):
        return f"{encryption.decrypt_searchable_data(self.job_id)}"

    def entry_directory(self):
        return f"{SIMULATIONS_FOLDER}/{encryption.decrypt_searchable_data(self.job_id)}"

    def destroy(self):
        db_session.delete(self)
        db_session.commit()

    def __repr__(self):
        return f"<CatalogEntry {self.id}: {encryption.decrypt_searchable_data(self.job_id)} >"

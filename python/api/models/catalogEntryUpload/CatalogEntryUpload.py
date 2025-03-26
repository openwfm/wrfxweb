from api.session import db_session
import api.encryption as encryption
from api.apiKeys import UPLOADS_FOLDER, TEMP_FOLDER
from api.models.catalogEntryUpload.CatalogEntryUploadDbModel import (
    CatalogEntryUploadDbModel,
)


class CatalogEntryUpload(CatalogEntryUploadDbModel):
    def upload_path(self):
        return f"{UPLOADS_FOLDER}/{self.id}.zip"

    def unzip_directory(self):
        return f"{TEMP_FOLDER}/{self.id}"

    def unzipped_catalog(self):
        return f"{self.unzip_directory()}/catalog.json"

    def file_name(self):
        decrypted_filename = encryption.decrypt_user_data(self.zip_filename)
        return decrypted_filename

    def destroy(self):
        db_session.delete(self)
        db_session.commit()

    def process(self):
        self.processed = True
        db_session.commit()

    def __repr__(self):
        return f"<CatalogEntryUpload {self.id}>"

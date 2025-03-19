from api.session import db_session
from api.apiKeys import UPLOADS_FOLDER
from api.models.catalogEntryUpload.CatalogEntryUploadDbModel import (
    CatalogEntryUploadDbModel,
)


class CatalogEntryUpload(CatalogEntryUploadDbModel):
    def upload_path(self):
        return f"{UPLOADS_FOLDER}/{self.id}.zip"

    def destroy(self):
        db_session.delete(self)
        db_session.commit()

    def __repr__(self):
        return f"<CatalogEntryUpload {self.id}>"

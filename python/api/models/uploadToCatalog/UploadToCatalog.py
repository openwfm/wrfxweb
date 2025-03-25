from api.session import db_session
from api.models.uploadToCatalog.UploadToCatalogDbModel import (
    UploadToCatalogDbModel,
)


class UploadToCatalog(UploadToCatalogDbModel):
    def destroy(self):
        db_session.delete(self)
        db_session.commit()

    def __repr__(self):
        return f"<UploadToCatalog {self.id} catalog_id: {self.catalog_id} catalog_entry_upload_id: {self.catalog_entry_upload_id}>"

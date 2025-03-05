from api.db import Base
from api.apiKeys import UPLOADS_FOLDER
import api.encryption as encryption


from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship


class CatalogEntryUpload(Base):
    __tablename__ = "catalog_entry_upload"
    id = Column(Integer, primary_key=True)
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    catalog_id = Column(Integer, ForeignKey("catalog.id"))
    user = relationship("User", foreign_keys="CatalogEntryUpload.uploader_id")
    entry_type = Column(String(255), nullable=False)
    zip_filename = Column(String(255), nullable=False)

    def upload_path(self):
        zip_filename = encryption.decrypt_searchable_data(self.zip_filename)
        return f"{UPLOADS_FOLDER}/{zip_filename}"

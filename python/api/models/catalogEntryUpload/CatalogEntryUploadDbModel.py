from api.db import Base


from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship


class CatalogEntryUploadDbModel(Base):
    __tablename__ = "catalog_entry_upload"
    id = Column(Integer, primary_key=True)
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", foreign_keys="CatalogEntryUpload.uploader_id")
    entry_type = Column(String(255), nullable=False)
    zip_filename = Column(String(255), nullable=False)

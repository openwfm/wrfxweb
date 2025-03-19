from api.db import Base

from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship


class CatalogEntryCatalogDbModel(Base):
    __tablename__ = "catalog_entry_catalog"
    id = Column(Integer, primary_key=True)
    catalog_id = Column(Integer, ForeignKey("catalog.id"), nullable=False)
    catalog_entry_id = Column(Integer, ForeignKey("catalog_entry.id"))
    catalog_entry_upload_id = Column(Integer, ForeignKey("catalog_entry_upload.id"))
    catalog = relationship("Catalog", foreign_keys="CatalogEntryCatalog.catalog_id")
    catalog_entry = relationship(
        "CatalogEntry", foreign_keys="CatalogEntryCatalog.catalog_entry_id"
    )
    catalog_entry_upload = relationship(
        "CatalogEntryUpload", foreign_keys="CatalogEntryCatalog.catalog_entry_upload_id"
    )

    def __repr__(self):
        return f"<CatalogEntryCatalog {self.id}: catalog_id: {self.catalog_id} catalog_entry_id: {self.catalog_entry_id}>"

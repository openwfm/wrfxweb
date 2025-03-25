from api.db import Base


from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship


class UploadToCatalogDbModel(Base):
    __tablename__ = "upload_to_catalog"
    id = Column(Integer, primary_key=True)
    catalog_id = Column(Integer, ForeignKey("catalog.id"), nullable=False)
    catalog_entry_upload_id = Column(
        Integer, ForeignKey("catalog_entry_upload.id"), nullable=False
    )
    catalog_entry_upload = relationship(
        "CatalogEntryUpload",
        foreign_keys="UploadToCatalogDbModel.catalog_entry_upload_id",
    )
    catalog = relationship(
        "Catalog",
        foreign_keys="UploadToCatalogDbModel.catalog_id",
    )

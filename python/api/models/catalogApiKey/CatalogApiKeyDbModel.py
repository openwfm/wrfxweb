from api.db import Base

from sqlalchemy import Column, Integer, ForeignKey, String, LargeBinary
from sqlalchemy.orm import relationship


class CatalogApiKeyDbModel(Base):
    __tablename__ = "catalog_api_key"
    id = Column(Integer, primary_key=True)
    catalog_id = Column(Integer, ForeignKey("catalog.id"), nullable=False)
    date_created = Column(String(10), nullable=False)
    encrypted_api_key = Column(LargeBinary)
    catalog = relationship("Catalog", foreign_keys="CatalogEntryCatalog.catalog_id")

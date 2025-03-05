from api.db import Base
from sqlalchemy import Column, Integer, String, Boolean

import api.encryption as encryption
from api.apiKeys import SIMULATIONS_FOLDER
from api.models.CatalogAccess import CatalogAccess
from api.models.CatalogEntryCatalog import CatalogEntryCatalog
from api.validators import utils as validationUtils

from sqlalchemy import or_, select


class Catalog(Base):
    __tablename__ = "catalog"
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    date_created = Column(String(10), nullable=False)
    public = Column(Boolean, default=False)

    def permissions(self):
        return CatalogAccess.query.filter_by(catalog_id=self.id).all()

    def entries(self):
        catalog_id = self.id

        catalog_entry_catalogs = CatalogEntryCatalog.query.filter_by(
            catalog_id=catalog_id
        ).all()

        # return CatalogEntry.query.filter_by(catalog_id=self.id).all()
        return [
            catalog_entry_catalog.catalog_entry
            for catalog_entry_catalog in catalog_entry_catalogs
        ]

    def catalog_folder(self):
        sanitized_id = validationUtils.sanitize_path(f"{self.id}")
        return f"{SIMULATIONS_FOLDER}/{sanitized_id}"

    def __repr__(self):
        return f"<Catalog: {self.id}, public: {self.public}>"

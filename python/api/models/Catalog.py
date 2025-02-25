from api.db import db
from api.apiKeys import SIMULATIONS_FOLDER
from api.models.CatalogAccess import CatalogAccess
from api.models.CatalogEntry import CatalogEntry
from api.models.CatalogEntryCatalog import CatalogEntryCatalog
from api.validators import utils as validationUtils

from sqlalchemy import or_, select, join


class Catalog(db.Model):
    __tablename__ = "catalog"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    date_created = db.Column(db.String(10), nullable=False)
    public = db.Column(db.Boolean, default=False)

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

    def user_has_access(self, user):
        if self.public:
            return True

        any_access_query = (
            select(CatalogAccess)
            .filter_by(catalog_id=self.id)
            .where(
                or_(
                    CatalogAccess.user_id == user.id,
                    CatalogAccess.domain == user.domain(),
                )
            )
        )
        return db.session.execute(any_access_query).first() != None

    def catalog_folder(self):
        sanitized_id = validationUtils.sanitize_path(f"{self.id}")
        return f"{SIMULATIONS_FOLDER}/{sanitized_id}"

    def __repr__(self):
        return f"<Catalog: {self.id}, public: {self.public}>"

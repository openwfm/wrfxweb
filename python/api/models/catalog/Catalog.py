from api.session import db_session
from api.models.catalog.CatalogDbModel import CatalogDbModel
from api.models.CatalogAccess import CatalogAccess
from api.models.CatalogEntryCatalog import CatalogEntryCatalog

from api.validators import utils as validationUtils
from api.apiKeys import SIMULATIONS_FOLDER
import api.encryption as encryption

from sqlalchemy import select, or_


class Catalog(CatalogDbModel):
    def permissions(self):
        return db_session.query(CatalogAccess).filter_by(catalog_id=self.id).all()

    def entries(self):
        catalog_id = self.id

        catalog_entry_catalogs = (
            db_session.query(CatalogEntryCatalog).filter_by(catalog_id=catalog_id).all()
        )

        return [
            catalog_entry_catalog.catalog_entry
            for catalog_entry_catalog in catalog_entry_catalogs
        ]

    def catalog_folder(self):
        sanitized_id = validationUtils.sanitize_path(f"{self.id}")
        return f"{SIMULATIONS_FOLDER}/{sanitized_id}"

    def destroy(self):
        db_session.delete(self)
        db_session.commit()

    def user_has_access(self, user):
        if self.public:
            return True

        encrypted_user_domain = encryption.encrypt_user_data(user.domain())
        any_access_query = (
            select(CatalogAccess)
            .filter_by(catalog_id=self.id)
            .where(
                or_(
                    CatalogAccess.user_id == user.id,
                    CatalogAccess.encrypted_domain == encrypted_user_domain,
                )
            )
        )
        return db_session.execute(any_access_query).first() != None

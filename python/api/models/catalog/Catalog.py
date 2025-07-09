from api.session import db_session
from api.models.catalog.CatalogDbModel import CatalogDbModel
from api.models.CatalogAccess import CatalogAccess
from api.models.catalogApiKey.CatalogApiKey import CatalogApiKey
from api.models.catalogEntryCatalog.CatalogEntryCatalog import CatalogEntryCatalog
from api.models.layerType.LayerType import LayerType
from api.models.simLayer.SimLayer import SimLayer
from api.models.layerTimestamp.LayerTimestamp import LayerTimestamp
from api.models.layerTimestamp.LayerTimestampCoords import LayerTimestampCoords
from api.models.colorbar.Colorbar import Colorbar
from api.models.colorbar.ColorbarLevels import ColorbarLevels

import api.encryption as encryption

from sqlalchemy import select, or_


class Catalog(CatalogDbModel):
    def permissions(self):
        return db_session.query(CatalogAccess).filter_by(catalog_id=self.id).all()

    def entries(self):
        catalog_id = self.id

        catalog_entry_catalogs = (
            db_session.query(CatalogEntryCatalog)
            .filter(CatalogEntryCatalog.catalog_entry_id != None)
            .filter_by(catalog_id=catalog_id)
            .all()
        )

        return [
            catalog_entry_catalog.catalog_entry
            for catalog_entry_catalog in catalog_entry_catalogs
            if not catalog_entry_catalog.catalog_entry.archived
        ]

    def catalog_api_key(self):
        return db_session.query(CatalogApiKey).filter_by(catalog_id=self.id).first()

    def destroy(self):
        catalog_entry_catalogs = (
            db_session.query(CatalogEntryCatalog)
            .filter(CatalogEntryCatalog.catalog_entry_id != None)
            .filter_by(catalog_id=self.id)
            .all()
        )
        for entry in catalog_entry_catalogs:
            db_session.delete(entry)
        for permission in self.permissions():
            db_session.delete(permission)
        catalog_api_key = self.catalog_api_key()
        if catalog_api_key != None:
            db_session.delete(catalog_api_key)
        db_session.delete(self)
        db_session.commit()

    def verify_upload_key(self, upload_key):
        catalog_api_key = self.catalog_api_key()
        if catalog_api_key == None:
            return False
        encrypted_upload_key = encryption.encrypt_api_key(upload_key)
        return encrypted_upload_key == catalog_api_key.encrypted_api_key

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

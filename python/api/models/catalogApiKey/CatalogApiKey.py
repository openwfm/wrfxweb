from api.session import db_session
from api.models.catalogApiKey.CatalogApiKeyDbModel import CatalogApiKeyDbModel


class CatalogApiKey(CatalogApiKeyDbModel):
    def destroy(self):
        db_session.delete(self)
        db_session.commit()

    def __repr__(self):
        return f"<CatalogApiKey {self.id}: catalog_id: {self.catalog_id} created: {self.date_created} >"

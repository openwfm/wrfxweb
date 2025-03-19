from api.session import db_session
from api.models.catalogEntryCatalog.CatalogEntryCatalogDbModel import (
    CatalogEntryCatalogDbModel,
)


class CatalogEntryCatalog(CatalogEntryCatalogDbModel):
    def destroy(self):
        db_session.delete(self)
        db_session.commit()

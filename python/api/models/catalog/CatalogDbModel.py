from api.db import Base
from sqlalchemy import Column, Integer, String, Boolean

# import api.encryption as encryption
# from api.apiKeys import SIMULATIONS_FOLDER
# from api.models.CatalogAccess import CatalogAccess
# from api.models.CatalogEntryCatalog import CatalogEntryCatalog
# from api.validators import utils as validationUtils
#
# from sqlalchemy import or_, select
#


class CatalogDbModel(Base):
    __tablename__ = "catalog"
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    date_created = Column(String(10), nullable=False)
    public = Column(Boolean, default=False)

    def __repr__(self):
        return f"<Catalog: {self.id}, public: {self.public}>"

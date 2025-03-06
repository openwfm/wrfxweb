from api.db import Base

# from api.models.User import User
from api.apiKeys import SIMULATIONS_FOLDER

from sqlalchemy import Column, Integer, ForeignKey, String


class CatalogEntryDbModel(Base):
    __tablename__ = "catalog_entry"
    id = Column(Integer, primary_key=True)
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    entry_type = Column(String(255), nullable=False)
    from_utc = Column(String(255), nullable=False)
    to_utc = Column(String(255), nullable=False)
    description = Column(String(255), nullable=False)
    manifest_path = Column(String(255), nullable=False)
    job_id = Column(String(255), nullable=False)
    zip_size = Column(Integer, nullable=True)
    kml_size = Column(Integer, nullable=True)
    processed_utc = Column(String(255), nullable=True)
    run_utc = Column(String(255), nullable=True)
    zip_url = Column(String(255), nullable=True)
    kml_url = Column(String(255), nullable=True)

    # def entry_path(self):
    #     entry_path = f"{SIMULATIONS_FOLDER}/{self.job_id}"
    #     return entry_path
    #
    # def entry_manifest_path(self):
    #     manifest_path = f"{SIMULATIONS_FOLDER}/{self.manifest_path}"
    #     return manifest_path
    #
    # def uploader(self):
    #     if self.uploader_id == None or self.uploader_id < 1:
    #         return None
    #     return User.query.get(self.uploader_id)
    #
    # def directory(self):
    #     return SIMULATIONS_FOLDER

    # def destroy(self):
    #     db.session.delete(self)
    #     db.session.commit()

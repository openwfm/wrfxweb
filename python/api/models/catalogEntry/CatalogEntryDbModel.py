from api.db import Base

# from api.models.User import User
from api.apiKeys import SIMULATIONS_FOLDER

from sqlalchemy import Column, Integer, ForeignKey, String, Boolean


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
    archived = Column(Boolean, default=False)

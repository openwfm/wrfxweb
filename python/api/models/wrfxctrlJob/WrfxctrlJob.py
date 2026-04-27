from api.db import Base
from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship


class WrfxctrlJob(Base):
    __tablename__ = "wrfxctrl_job"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", foreign_keys="WrfxctrlJob.user_id")
    catalog_entry_id = Column(Integer, ForeignKey("catalog_entry.id"), nullable=True)
    catalog_entry = relationship(
        "CatalogEntry", foreign_keys="WrfxctrlJob.catalog_entry_id"
    )
    submit_time = Column(String(255), nullable=False)
    catalog_id = Column(Integer, ForeignKey("catalog.id"), nullable=False)
    catalog = relationship("Catalog", foreign_keys="WrfxctrlJob.catalog_id")
    job_id = Column(String(255), nullable=False)
    status = Column(String(255), nullable=True)
    description = Column(String(255), nullable=False)

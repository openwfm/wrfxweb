from api.db import Base


from sqlalchemy import Column, Integer, ForeignKey, Float
from sqlalchemy.orm import relationship


class ColorbarLevelsDbModel(Base):
    __tablename__ = "colorbar_levels"
    id = Column(Integer, primary_key=True)
    value = Column(Float, nullable=False)
    index = Column(Integer, nullable=False)
    colorbar_id = Column(Integer, ForeignKey("colorbar.id"))
    colorbar = relationship("Colorbar", foreign_keys="ColorbarLevel.colorbar_id")

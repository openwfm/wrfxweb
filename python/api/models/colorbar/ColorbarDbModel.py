from api.db import Base


from sqlalchemy import Column, Integer, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship


class ColorbarDbModel(Base):
    __tablename__ = "colorbar"
    id = Column(Integer, primary_key=True)
    encrypted_png_url = Column(LargeBinary)
    layer_timestamp_id = Column(Integer, ForeignKey("layer_timestamp.id"))
    layer_timestamp = relationship(
        "LayerTimestamp", foreign_keys="Colorbar.layer_timestamp_id"
    )

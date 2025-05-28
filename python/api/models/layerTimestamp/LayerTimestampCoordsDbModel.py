from api.db import Base


from sqlalchemy import Column, Integer, ForeignKey, Float
from sqlalchemy.orm import relationship


class LayerTimestampCoordsDbModel(Base):
    __tablename__ = "layer_timestamp_coords"
    id = Column(Integer, primary_key=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    index = Column(Integer, nullable=False)
    layer_timestamp_id = Column(Integer, ForeignKey("layer_timestamp.id"))
    layer_timestamp = relationship(
        "LayerTimestamp", foreign_keys="LayerTimestampCoords.layer_timestamp_id"
    )

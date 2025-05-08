from api.db import Base


from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    String,
    ARRAY,
    Float,
    LargeBinary,
)
from sqlalchemy.orm import relationship


class LayerTimestampDbModel(Base):
    __tablename__ = "layer_timestamp"
    id = Column(Integer, primary_key=True)
    coords = Column(ARRAY(Float))
    encrypted_png_url = Column(LargeBinary)
    sim_layer_id = Column(Integer, ForeignKey("sim_layer.id"))
    sim_layer = relationship("SimLayer", foreign_keys="LayerTimestamp.sim_layer_id")
    date_created = Column(String(10), nullable=False)

from api.db import Base


from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    String,
    LargeBinary,
)
from sqlalchemy.orm import relationship


class LayerTimestampDbModel(Base):
    __tablename__ = "layer_timestamp"
    id = Column(Integer, primary_key=True)
    encrypted_png_url = Column(LargeBinary)
    encrypted_kml_url = Column(LargeBinary)
    sim_layer_id = Column(Integer, ForeignKey("sim_layer.id"))
    sim_layer = relationship("SimLayer", foreign_keys="LayerTimestamp.sim_layer_id")
    timestamp = Column(String(10), nullable=False)

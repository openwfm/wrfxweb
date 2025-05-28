from api.db import Base

from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship


class SimLayerDbModel(Base):
    __tablename__ = "sim_layer"
    id = Column(Integer, primary_key=True)
    layer_type_id = Column(Integer, ForeignKey("layer_type.id"), nullable=False)
    catalog_entry_id = Column(Integer, ForeignKey("catalog_entry.id"), nullable=False)
    layer_type = relationship("LayerType", foreign_keys="SimLayer.layer_type_id")
    catalog_entry = relationship(
        "CatalogEntry", foreign_keys="SimLayer.catalog_entry_id"
    )
    domain = Column(Integer)

    def __repr__(self):
        return f"<SimLayer {self.id} catalog_entry_id: {self.catalog_entry_id} layer_type_id: {self.layer_type_id}>"

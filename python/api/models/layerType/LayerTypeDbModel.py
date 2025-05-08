from api.db import Base


from sqlalchemy import Column, Integer, String


class LayerTypeDbModel(Base):
    __tablename__ = "layer_type"
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=True)

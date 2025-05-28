from api.session import db_session
from api.models.layerType.LayerTypeDbModel import (
    LayerTypeDbModel,
)
from api.models.simLayer.SimLayer import SimLayer


class LayerType(LayerTypeDbModel):
    def destroy(self):
        db_session.delete(self)
        db_session.commit()

    def __repr__(self):
        return f"<LayerType {self.id}>"

from api.session import db_session
from api.models.simLayer.SimLayerDbModel import (
    SimLayerDbModel,
)

from api.models.layerTimestamp.LayerTimestamp import (
    LayerTimestamp,
)


class SimLayer(SimLayerDbModel):
    def layer_timestamps(self):
        return db_session.query(LayerTimestamp).filter_by(sim_layer_id=self.id).all()

    def destroy(self):
        layerTimestamps = self.layer_timestamps()
        for layerTimestamp in layerTimestamps:
            layerTimestamp.destroy()
        db_session.delete(self)
        db_session.commit()

    def name(self):
        return self.layer_type.name

    def __repr__(self):
        return f"<SimLayer {self.id}>"

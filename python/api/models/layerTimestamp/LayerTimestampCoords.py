from api.session import db_session
from api.models.layerTimestamp.LayerTimestampCoordsDbModel import (
    LayerTimestampCoordsDbModel,
)


class LayerTimestampCoords(LayerTimestampCoordsDbModel):
    def destroy(self):
        db_session.delete(self)
        db_session.commit()

    def __repr__(self):
        return f"<LayerTimestampCoords {self.id} layer_timestamp_id: {self.layer_timestamp_id} value: {self.value} index: {self.value} >"

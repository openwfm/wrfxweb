from api.session import db_session
import api.encryption as encryption
from api.apiKeys import UPLOADS_FOLDER, TEMP_FOLDER
from api.models.layerType.LayerTypeDbModel import (
    LayerTypeDbModel,
)


class LayerType(LayerTypeDbModel):
    def destroy(self):
        db_session.delete(self)
        db_session.commit()

    def __repr__(self):
        return f"<LayerType {self.id}>"

from api.session import db_session
import api.encryption as encryption
from api.models.layerTimestamp.LayerTimestampDbModel import (
    LayerTimestampDbModel,
)
from api.models.layerTimestamp.LayerTimestampCoords import (
    LayerTimestampCoords,
)

from api.models.colorbar.Colorbar import (
    Colorbar,
)
from datetime import datetime


class LayerTimestamp(LayerTimestampDbModel):
    def png_full_path(self):
        entry_path = self.sim_layer.catalog_entry.entry_path()
        return f"{entry_path}/{self.png_url()}"

    def kml_full_path(self):
        entry_path = self.sim_layer.catalog_entry.entry_path()
        return f"{entry_path}/{self.kml_url()}"

    def png_url(self):
        return encryption.decrypt_png_url(self.encrypted_png_url)

    def kml_url(self):
        if self.encrypted_kml_url != None:
            return encryption.decrypt_png_url(self.encrypted_kml_url)
        return ""

    def colorbar(self):
        return db_session.query(Colorbar).filter_by(layer_timestamp_id=self.id).first()

    def age_in_days(self):
        date_format = "%Y-%m-%d_%H:%M:%S"
        datetime_timestamp = datetime.strptime(self.timestamp, date_format)
        return (datetime.now() - datetime_timestamp).days

    def coords(self):
        layer_timestamp_coords = (
            db_session.query(LayerTimestampCoords)
            .filter_by(layer_timestamp_id=self.id)
            .all()
        )
        return sorted(
            layer_timestamp_coords,
            key=lambda x: x.index,
        )

    def destroy(self):
        timestamp_colorbar = self.colorbar()
        if timestamp_colorbar != None:
            timestamp_colorbar.destroy()
        for layer_timestamp_coord in self.coords():
            layer_timestamp_coord.destroy()

        db_session.delete(self)
        db_session.commit()

    def __repr__(self):
        return f"<LayerTimestamp {self.id}>"

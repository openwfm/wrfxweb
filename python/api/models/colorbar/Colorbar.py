from api.session import db_session
import api.encryption as encryption
from api.models.colorbar.ColorbarDbModel import (
    ColorbarDbModel,
)


class Colorbar(ColorbarDbModel):
    def destroy(self):
        db_session.delete(self)
        db_session.commit()

    def png_url(self):
        return encryption.decrypt_png_url(self.encrypted_png_url)

    def png_full_path(self):
        entry_path = self.layer_timestamp.sim_layer.catalog_entry.entry_path()
        return f"{entry_path}/{self.png_url()}"

    def __repr__(self):
        return f"<Colorbar {self.id}>"

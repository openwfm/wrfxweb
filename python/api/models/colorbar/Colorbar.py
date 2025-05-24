from api.session import db_session
import api.encryption as encryption
from api.models.colorbar.ColorbarDbModel import (
    ColorbarDbModel,
)
from api.models.colorbar.ColorbarLevels import (
    ColorbarLevels,
)


class Colorbar(ColorbarDbModel):
    def levels(self):
        colorbar_levels = (
            db_session.query(ColorbarLevels).filter_by(colorbar_id=self.id).all()
        )
        return sorted(colorbar_levels, key=lambda x: x.value)

    def png_url(self):
        return encryption.decrypt_png_url(self.encrypted_png_url)

    def png_full_path(self):
        entry_path = self.layer_timestamp.sim_layer.catalog_entry.entry_path()
        return f"{entry_path}/{self.png_url()}"

    def destroy(self):
        for level in self.levels():
            level.destroy()

        db_session.delete(self)
        db_session.commit()

    def __repr__(self):
        return f"<Colorbar {self.id}>"

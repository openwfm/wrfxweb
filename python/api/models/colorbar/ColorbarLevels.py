from api.session import db_session
from api.models.colorbar.ColorbarLevelsDbModel import (
    ColorbarLevelsDbModel,
)


class ColorbarLevels(ColorbarLevelsDbModel):
    def destroy(self):
        db_session.delete(self)
        db_session.commit()

    def __repr__(self):
        return f"<ColorbarLevels {self.id} colorbar_id: {self.colorbar_id} value: {self.value} index: {self.index}>"

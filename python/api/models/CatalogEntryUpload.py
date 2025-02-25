from api.db import db
from api.apiKeys import UPLOADS_FOLDER
from api.validators import utils as validationUtils


class CatalogEntryUpload(db.Model):
    __tablename__ = "catalog_entry_upload"
    id = db.Column(db.Integer, primary_key=True)
    uploader_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    catalog_id = db.Column(db.Integer, db.ForeignKey("catalog.id"))
    user = db.relationship("User", foreign_keys="CatalogEntryUpload.uploader_id")
    entry_type = db.Column(db.String(255), nullable=False)
    zip_filename = db.Column(db.String(255), nullable=False)

    def upload_path(self):
        return f"{UPLOADS_FOLDER}/{self.zip_filename}"

    def destroy(self):
        db.session.delete(self)
        db.session.commit()

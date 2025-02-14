from clientServer.app import db
from clientServer.serverKeys import UPLOADS_FOLDER
from clientServer.validators import utils as validationUtils


class CatalogEntryUpload(db.Model):
    __tablename__ = "catalog_entry_upload"
    id = db.Column(db.Integer, primary_key=True)
    uploader_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    catalog_id = db.Column(db.Integer, db.ForeignKey("catalog.id"))
    user = db.relationship("User", foreign_keys="CatalogEntryUpload.uploader_id")
    entry_type = db.Column(db.String(255), nullable=False)

    def upload_path(self):
        sanitized_id = validationUtils.sanitize_path(f"{self.id}")
        return f"{UPLOADS_FOLDER}/{sanitized_id}.zip"

    def destroy(self):
        db.session.delete(self)
        db.session.commit()

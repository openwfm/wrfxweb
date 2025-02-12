from clientServer.app import db, aesgcm
from clientServer.serverKeys import ENCRYPTION_NONCE


class CatalogEntry(db.Model):
    __tablename__ = "catalog_entry"
    id = db.Column(db.Integer, primary_key=True)
    catalog_id = db.Column(db.Integer, db.ForeignKey("catalog.id"))
    name = db.Column(db.String(255), nullable=False)
    uploader_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    encrypted_entry_path = db.Column(db.LargeBinary, nullable=False)
    user = db.relationship("User", foreign_keys="CatalogEntry.uploader_id")
    # type = db.Column(db.String(255), nullable=False)
    # entry_type = db.Column(db.String(255), nullable=False)
    # zip_size = db.Column(db.String(255), nullable=True)
    # description = db.Column(db.String(255), nullable=False)
    # to_utc = db.Column(db.String(255), nullable=False)
    # kml_size = db.Column(db.String(255), nullable=True)
    # from_utc = db.Column(db.String(255), nullable=False)
    # processed_utc = db.Column(db.String(255), nullable=True)
    # manifest_path = db.Column(db.String(255), nullable=False)
    # run_utc = db.Column(db.String(255), nullable=True)
    # zip_url = db.Column(db.String(255), nullable=True)
    # kml_url = db.Column(db.String(255), nullable=True)
    # job_id = db.Column(db.String(255), nullable=False)

    def entry_path(self):
        return aesgcm.decrypt(ENCRYPTION_NONCE, self.encrypted_entry_path, b"").decode()

    def destroy(self):
        db.session.delete(self)
        db.session.commit()

from api.db import db
from api.apiKeys import SIMULATIONS_FOLDER
from api.validators import utils as validationUtils


class CatalogEntry(db.Model):
    __tablename__ = "catalog_entry"
    id = db.Column(db.Integer, primary_key=True)
    catalog_id = db.Column(db.Integer, db.ForeignKey("catalog.id"), nullable=False)
    uploader_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    user = db.relationship("User", foreign_keys="CatalogEntry.uploader_id")
    catalog = db.relationship("Catalog", foreign_keys="CatalogEntry.catalog_id")
    entry_type = db.Column(db.String(255), nullable=False)
    from_utc = db.Column(db.String(255), nullable=False)
    to_utc = db.Column(db.String(255), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    manifest_path = db.Column(db.String(255), nullable=False)
    job_id = db.Column(db.String(255), nullable=False)
    zip_size = db.Column(db.String(255), nullable=True)
    kml_size = db.Column(db.String(255), nullable=True)
    processed_utc = db.Column(db.String(255), nullable=True)
    run_utc = db.Column(db.String(255), nullable=True)
    zip_url = db.Column(db.String(255), nullable=True)
    kml_url = db.Column(db.String(255), nullable=True)

    def entry_path(self):
        entry_path = f"{SIMULATIONS_FOLDER}/{self.job_id}"
        return validationUtils.sanitize_path(entry_path)

    def destroy(self):
        db.session.delete(self)
        db.session.commit()

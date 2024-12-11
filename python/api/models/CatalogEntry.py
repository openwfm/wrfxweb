from ..api import db


class CatalogEntry(db.Model):
    __tablename__ = "catalog_entry"
    id = db.Column(db.Integer, primary_key=True)
    catalog_id = db.Column(db.Integer, db.ForeignKey("catalog.id"))
    name = db.Column(db.String(255), nullable=False)
    zip_size = db.Column(db.String(255), nullable=True)
    description = db.Column(db.String(255), nullable=False)
    to_utc = db.Column(db.String(255), nullable=False)
    kml_size = db.Column(db.String(255), nullable=True)
    from_utc = db.Column(db.String(255), nullable=False)
    processed_utc = db.Column(db.String(255), nullable=True)
    manifest_path = db.Column(db.String(255), nullable=False)
    run_utc = db.Column(db.String(255), nullable=True)
    zip_url = db.Column(db.String(255), nullable=True)
    kml_url = db.Column(db.String(255), nullable=True)
    job_id = db.Column(db.String(255), nullable=False)

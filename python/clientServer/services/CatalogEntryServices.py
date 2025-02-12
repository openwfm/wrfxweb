from clientServer.app import db
from clientServer.models.CatalogEntry import CatalogEntry
from clientServer.serverKeys import ADMIN_UPLOADS_FOLDER


def create(catalog_entry_params):
    save_path = catalog_entry_params["save_path"]
    zip_file = catalog_entry_params["zip_file"]

    zip_file.save(save_path)

    # catalog_entry = CatalogEntry(
    #     catalog_id = db.Column(db.Integer, db.ForeignKey("catalog.id"))
    #     name = db.Column(db.String(255), nullable=False)
    #     uploader_id = db.Column(db.Integer, nullable=False)
    #     admin_uploader = db.Column(db.Boolean, nullable=False)
    # )
    # db.session.add(catalog_entry)
    # db.session.commit()

    pass


def destroy(catalog_id, catalog_entry_id):
    pass


def destroy_all(catalog_id):
    pass


def find_by_id(catalog_id, catalog_entry_id):
    pass


def find_all(catalog_id):
    pass

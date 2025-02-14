from clientServer.app import app

from clientServer.routes.admin.admin_utils import admin_login_required

from clientServer.validators import CatalogValidators as CatalogValidators
from clientServer.validators import (
    CatalogEntryUploadValidators as CatalogEntryUploadValidators,
)
from clientServer.services import (
    CatalogEntryUploadServices as CatalogEntryUploadServices,
)
from clientServer.services import CatalogServices as CatalogServices
from clientServer.serializers import CatalogEntrySerializer as CatalogEntrySerializer

from flask import request

# from flask_wtf import FlaskForm
# from flask_wtf.file import FileField
# from wtforms import SubmitField


@app.route("/admin/catalogs/<catalog_id>/entries", methods=["GET", "POST"])
@admin_login_required
def catalog_entries(catalog_id):
    if request.method == "GET":
        return get_catalog_entries(catalog_id)
    elif request.method == "POST":
        return create_catalog_entry(catalog_id)
    return {
        "message": "Method Not Allowed",
    }, 405


def get_catalog_entries(catalog_id):
    catalog = CatalogValidators.validate_catalog(catalog_id)
    return {
        "entries": CatalogEntrySerializer.serialize_catalog_entries(catalog.entries),
    }, 200


# class PostCatalogEntryForm(FlaskForm):
#     file = FileField('File')


def create_catalog_entry(catalog_id):
    zip_file = request.files["zipFile"]
    entry_type = ""
    catalog_entry_params = {
        "catalog_id": catalog_id,
        "zip_file": zip_file,
        "entry_type": entry_type,
    }
    validated_catalog_entry_params = (
        CatalogEntryUploadValidators.validate_catalog_entry_upload(catalog_entry_params)
    )
    CatalogEntryUploadServices.create(validated_catalog_entry_params)

    return {
        "message": "Entry Successfully Created!",
    }, 200

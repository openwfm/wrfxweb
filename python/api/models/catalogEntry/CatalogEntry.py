from api.session import db_session
from api.models.User import User
from api.models.catalogEntry.CatalogEntryDbModel import CatalogEntryDbModel
from api.models.layerTimestamp.LayerTimestamp import LayerTimestamp
from api.models.catalogEntryCatalog.CatalogEntryCatalog import CatalogEntryCatalog
from api.models.simLayer.SimLayer import SimLayer
from api.apiKeys import (
    SIMULATIONS_FOLDER,
    MANIFEST_FILENAME,
    CATALOG_FILENAME,
)
import api.encryption as encryption
from sqlalchemy import select, outerjoin
import posixpath as pxp
import os

KMZ_INC = "inc"
KMZ_REF = "ref"
EMPTY = ""


class CatalogEntry(CatalogEntryDbModel):
    def entry_path(self):
        entry_path = os.path.join(
            SIMULATIONS_FOLDER, encryption.decrypt_searchable_data(self.job_id)
        )
        return entry_path

    def entry_manifest_path(self):
        manifest_path = os.path.join(SIMULATIONS_FOLDER, self.manifest_filename())
        return manifest_path

    def manifest_filename(self):
        manifest = encryption.decrypt_searchable_data(self.manifest_path)
        return manifest

    def entry_description(self):
        return encryption.decrypt_searchable_data(self.description)

    def entry_catalog_path(self):
        home_dir = self.entry_path()
        catalog_path = os.path.join(home_dir, CATALOG_FILENAME)
        return catalog_path

    def web_manifest_path(self):
        home_dir = self.entry_path()
        manifest_path = os.path.join(home_dir, MANIFEST_FILENAME)
        return manifest_path

    def uploader(self):
        if self.uploader_id == None or self.uploader_id < 1:
            return None
        return User.query.get(self.uploader_id)

    def directory(self):
        return SIMULATIONS_FOLDER

    def zip_filename(self):
        return encryption.decrypt_searchable_data(self.zip_url)

    def zip_filepath(self):
        return os.path.join(self.entry_path(), self.zip_filename())

    def zip_archive_base(self):
        return f"{self.folder_name()}.zip"

    def zip_save_path(self):
        return os.path.join(self.entry_path(), self.zip_archive_base())

    def has_zip(self):
        return self.zip_filename() != ""

    def kml_base(self):
        return os.path.join(self.entry_path(), self.folder_name())

    def kml_inc_filename(self):
        return f"{self.folder_name()}_inc.kmz"

    def kml_ref_filename(self):
        return f"{self.folder_name()}_ref.kmz"

    def kml_mode_filename(self, mode):
        if mode == KMZ_INC or mode == EMPTY:
            return self.kml_inc_filename()
        elif mode == KMZ_REF:
            return self.kml_ref_filename()
        return None

    def kml_mode_filepath(self, mode):
        filename = self.kml_mode_filename(mode)
        if filename == None:
            return None
        return os.path.join(self.entry_path(), filename)

    def kml_href_join(self, mode):
        if mode == KMZ_INC or mode == EMPTY:
            return pxp.join
        elif mode == KMZ_REF:
            return os.path.join

    def kml_filename(self):
        return encryption.decrypt_searchable_data(self.kml_url)

    def kml_filepath(self):
        return os.path.join(self.entry_path(), self.kml_filename())

    def has_kml(self):
        return self.kml_filename() != ""

    def folder_name(self):
        return f"{encryption.decrypt_searchable_data(self.job_id)}"

    def entry_directory(self):
        return f"{SIMULATIONS_FOLDER}/{encryption.decrypt_searchable_data(self.job_id)}"

    def catalogs(self):
        catalog_entry_catalogs = (
            db_session.query(CatalogEntryCatalog)
            .filter_by(catalog_entry_id=self.id)
            .all()
        )

        return [
            catalog_entry_catalog.catalog
            for catalog_entry_catalog in catalog_entry_catalogs
        ]

    def sim_layers(self):
        return db_session.query(SimLayer).filter_by(catalog_entry_id=self.id).all()

    def sim_vars(self):
        return [layer.name() for layer in self.sim_layers()]

    def layer_timestamps(self):
        layer_timestamp_join = outerjoin(
            LayerTimestamp, SimLayer, LayerTimestamp.sim_layer_id == SimLayer.id
        )
        timestamp_query = (
            select(LayerTimestamp)
            .select_from(layer_timestamp_join)
            .where(layer_timestamp_join.c.sim_layer_catalog_entry_id == self.id)
        )
        return [row[0] for row in db_session.execute(timestamp_query)]

    def age_range_in_days(self):
        lts = self.layer_timestamps()
        upper_range = None
        lower_range = None
        for layer_timestamp in lts:
            timestamp_age = layer_timestamp.age_in_days()
            upper_range = (
                timestamp_age
                if upper_range == None
                else max(upper_range, timestamp_age)
            )
            lower_range = (
                timestamp_age
                if lower_range == None
                else min(lower_range, timestamp_age)
            )
        return [lower_range, upper_range]

    def process(self):
        pass

    def destroy(self):
        catalog_entry_catalogs = (
            db_session.query(CatalogEntryCatalog)
            .filter_by(catalog_entry_id=self.id)
            .all()
        )
        for entry in catalog_entry_catalogs:
            db_session.delete(entry)
        for sim_layer in self.sim_layers():
            sim_layer.destroy()

        db_session.delete(self)
        db_session.commit()

    def __repr__(self):
        return f"<CatalogEntry {self.id}: {encryption.decrypt_searchable_data(self.job_id)} >"

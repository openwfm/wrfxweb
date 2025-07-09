from api.session import db_session
from api.models.User import User
from api.models.catalogEntry.CatalogEntryDbModel import CatalogEntryDbModel
from api.models.layerTimestamp.LayerTimestamp import LayerTimestamp
from api.models.catalogEntryCatalog.CatalogEntryCatalog import CatalogEntryCatalog
from api.models.simLayer.SimLayer import SimLayer
from api.apiKeys import SIMULATIONS_FOLDER, MANIFEST_FILENAME
import api.encryption as encryption
from sqlalchemy import select, outerjoin


class CatalogEntry(CatalogEntryDbModel):
    def entry_path(self):
        entry_path = (
            f"{SIMULATIONS_FOLDER}/{encryption.decrypt_searchable_data(self.job_id)}"
        )
        return entry_path

    def entry_manifest_path(self):
        manifest_path = f"{SIMULATIONS_FOLDER}/{encryption.decrypt_searchable_data(self.manifest_path)}"
        return manifest_path

    def manifest_filename(self):
        manifest = encryption.decrypt_searchable_data(self.manifest_path)
        return manifest

    def web_manifest_path(self):
        home_dir = self.entry_path()
        manifest_path = f"{home_dir}/{MANIFEST_FILENAME}"
        return manifest_path

    def uploader(self):
        if self.uploader_id == None or self.uploader_id < 1:
            return None
        return User.query.get(self.uploader_id)

    def directory(self):
        return SIMULATIONS_FOLDER

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

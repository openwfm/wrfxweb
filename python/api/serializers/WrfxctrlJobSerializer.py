from api.serializers import CatalogSerializer as CatalogSerializer
from api.serializers import CatalogEntrySerializer as CatalogEntrySerializer
from api.validators.utils import sanitize_text


def serialize_wrfxctrl_job(wrfxctrl_job):
    if wrfxctrl_job == None:
        return {}
    return {
        "id": sanitize_text(f"{wrfxctrl_job.id}"),
        "type": sanitize_text(f"{wrfxctrl_job.permission_type()}"),
        "catalog": CatalogSerializer.serialize_catalog_without_entries(
            wrfxctrl_job.catalog
        ),
        "catalog_entry": CatalogEntrySerializer.serialize_catalog_entry(
            wrfxctrl_job.catalog_entry
        ),
    }


def serialize_wrfxctrl_jobs(wrfxctrl_jobs):
    return [serialize_wrfxctrl_job(wrfxctrl_job) for wrfxctrl_job in wrfxctrl_jobs]

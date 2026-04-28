from api.serializers import CatalogSerializer as CatalogSerializer
from api.serializers import CatalogEntrySerializer as CatalogEntrySerializer
from api.validators.utils import sanitize_text


def serialize_wrfxctrl_job(wrfxctrl_job):
    if wrfxctrl_job == None:
        return {}
    serialized_wrfxctrl_job = {
        "id": sanitize_text(f"{wrfxctrl_job.id}"),
        "status": sanitize_text(f"{wrfxctrl_job.status}"),
        "description": sanitize_text(f"{wrfxctrl_job.description}"),
        "job_id": sanitize_text(f"{wrfxctrl_job.job_id}"),
        "catalog": CatalogSerializer.serialize_catalog_without_entries(
            wrfxctrl_job.catalog
        ),
        "submit_time": sanitize_text(f"{wrfxctrl_job.submit_time}"),
    }
    catalog_entry = wrfxctrl_job.catalog_entry
    if catalog_entry != None:
        serialized_wrfxctrl_job["catalog_entry"] = (
            CatalogEntrySerializer.serialize_catalog_entry(catalog_entry)
        )
    return serialized_wrfxctrl_job


def serialize_wrfxctrl_jobs(wrfxctrl_jobs):
    return [serialize_wrfxctrl_job(wrfxctrl_job) for wrfxctrl_job in wrfxctrl_jobs]

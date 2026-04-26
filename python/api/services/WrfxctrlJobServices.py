from api.session import db_session
from api.models.wrfxctrlJob.WrfxctrlJob import WrfxctrlJob
from api.apiKeys import ADMIN_SERVICES_API_KEY

import api.encryption as encryption

from api.services import UserServices as UserServices
from api.services import AdminServices as AdminServices
from api.services import CatalogServices as CatalogServices
from api.services import CatalogEntryServices as CatalogEntryServices
from api.validators import utils as validationUtils
from api.validators import UserValidators as UserValidators

from sqlalchemy import select, or_


def find_by_user_id(user_id):
    try:
        user_id = validationUtils.validate_int_id(user_id)
        return db_session.query(WrfxctrlJob).filter_by(user_id=user_id).all()
    except:
        return []


def find_by_user_id_and_job_id(user_id, job_id):
    try:
        user_id = validationUtils.validate_int_id(user_id)
        job_id = validationUtils.validate_text(job_id)

        return (
            db_session.query(WrfxctrlJob)
            .filter_by(user_id=user_id, job_id=job_id)
            .first()
        )
    except:
        return None


def find_by_id(wrfxctrl_job_id):
    try:
        wrfxctrl_job_id = validationUtils.validate_int_id(wrfxctrl_job_id)
        return db_session.query(WrfxctrlJob).get(wrfxctrl_job_id)
    except:
        return None


def find_by_job_id(job_id):
    try:
        job_id = validationUtils.validate_text(job_id)
        return db_session.query(WrfxctrlJob).filter_by(job_id=job_id).first()
    except:
        return None


def find_or_create(user_id, job_id):
    try:
        wrfxctrl_job = find_by_user_id_and_job_id(user_id, job_id)
        if wrfxctrl_job != None:
            return wrfxctrl_job
        return create(user_id, job_id)
    except:
        return None


def create(user_id, job_id):
    try:
        user_id = UserValidators.validate_user_id(user_id)
        job_id = validationUtils.validate_text(job_id)

        new_wrfxctrl_job = WrfxctrlJob(user_id=user_id, job_id=job_id)
        db_session.add(new_wrfxctrl_job)
        db_session.commit()

        return new_wrfxctrl_job
    except:
        return None


def destroy_for_user(user_id):
    wrfxctrl_jobs = find_by_user_id(user_id)
    for wrfxctrl_job in wrfxctrl_jobs:
        db_session.delete(wrfxctrl_job)
    db_session.commit()


def destroy_by_id(wrfxctrl_job_id):
    wrfxctrl_job = find_by_id(wrfxctrl_job_id)
    if wrfxctrl_job:
        db_session.delete(wrfxctrl_job)
        db_session.commit()


def add_to_catalog(wrfxctrl_job_id, catalog_id):
    try:
        wrfxctrl_job = find_by_id(wrfxctrl_job_id)
        if wrfxctrl_job == None:
            raise ValueError(
                f"wrfxctrl_job_id {wrfxctrl_job_id} must be a valid WrfxctrlJob"
            )
        catalog_entry_id = wrfxctrl_job.catalog_entry_id
        if catalog_entry_id == None:
            raise ValueError(
                f"WrfxctrlJob[{wrfxctrl_job_id}] is not yet linked to a CatalogEntry"
            )
        if CatalogServices.user_has_access(catalog_id, wrfxctrl_job.user):
            CatalogEntryServices.create_catalog_entry_catalog(
                catalog_id, catalog_entry_id
            )
        return wrfxctrl_job
    except:
        return None


def add_catalog_entry_by_job_id(job_id, catalog_entry_id):
    try:
        wrfxctrl_job = find_by_job_id(job_id)
        if wrfxctrl_job == None:
            raise ValueError(f"job_id {job_id} must be a valid WrfxctrlJob")
        catalog_entry = CatalogEntryServices.find_by_id(catalog_entry_id)
        if catalog_entry == None:
            raise ValueError(
                f"catalog_entry_id {catalog_entry_id} must be a valid CatalogEntry"
            )

        catalog_entry_job_id = catalog_entry.job_id
        wrfxctrl_job_id = wrfxctrl_job.job_id
        if catalog_entry_job_id != wrfxctrl_job_id:
            raise ValueError(
                f"CatalogEntry job_id {catalog_entry_job_id} must match WrfxctrlJob job_id {wrfxctrl_job_id}"
            )

        wrfxctrl_job.catalog_entry_id = catalog_entry.id
        db_session.commit()
        return wrfxctrl_job
    except:
        return None


def add_catalog_entry(wrfxctrl_job_id, catalog_entry_id):
    try:
        wrfxctrl_job = find_by_id(wrfxctrl_job_id)
        if wrfxctrl_job == None:
            raise ValueError(
                f"wrfxctrl_job_id {wrfxctrl_job_id} must be a valid WrfxctrlJob"
            )
        catalog_entry = CatalogEntryServices.find_by_id(catalog_entry_id)
        if catalog_entry == None:
            raise ValueError(
                f"catalog_entry_id {catalog_entry_id} must be a valid CatalogEntry"
            )
        catalog_entry_job_id = catalog_entry.job_id
        wrfxctrl_job_id = wrfxctrl_job.job_id
        if catalog_entry_job_id != wrfxctrl_job_id:
            raise ValueError(
                f"CatalogEntry job_id {catalog_entry_job_id} must match WrfxctrlJob job_id {wrfxctrl_job_id}"
            )

        wrfxctrl_job.catalog_entry_id = catalog_entry.id
        db_session.commit()
        return wrfxctrl_job
    except:
        return None


def find_all():
    return db_session.query(WrfxctrlJob).all()


def destroy_all():
    wrfxctrl_jobs = find_all()
    for wrfxctrl_job in wrfxctrl_jobs:
        db_session.delete(wrfxctrl_job)
    db_session.commit()

from ..app import db
from ..models.CatalogAccess import CatalogAccess

from . import UserServices as UserServices


def find_by_user(catalog_id, user_id):
    return CatalogAccess.query.filter_by(catalog_id=catalog_id, user_id=user_id).first()


def find_by_domain(catalog_id, domain):
    return CatalogAccess.query.filter_by(catalog_id=catalog_id, domain=domain).first()


def create_for_user(catalog_id, email):
    user = UserServices.find_or_create(email)
    new_catalog_access = find_by_user(catalog_id, email)
    if new_catalog_access:
        return new_catalog_access
    new_catalog_access = CatalogAccess(
        catalog_id=catalog_id,
        user_id=user.id,
    )
    db.session.add(new_catalog_access)
    db.session.commit()
    return new_catalog_access


def create_for_domain(catalog_id, domain):
    new_catalog_access = find_by_domain(catalog_id, domain)
    if new_catalog_access:
        return new_catalog_access
    new_catalog_access = CatalogAccess(
        catalog_id=catalog_id,
        domain=domain,
    )
    db.session.add(new_catalog_access)
    db.session.commit()
    return new_catalog_access


def destroy_for_user(catalog_id, user_id):
    catalog_access = find_by_user(catalog_id, user_id)
    db.session.delete(catalog_access)
    db.session.commit()


def destroy_for_domain(catalog_id, domain):
    catalog_access = find_by_domain(catalog_id, domain)
    db.session.delete(catalog_access)
    db.session.commit()


def find_all(catalog_id):
    return CatalogAccess.query.filter_by(catalog_id=catalog_id).all()


def destroy_all(catalog_id):
    catalog_accesses = find_all(catalog_id)
    for catalog_access in catalog_accesses:
        db.session.delete(catalog_access)
    db.session.commit()

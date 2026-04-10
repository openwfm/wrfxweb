from api.session import db_session
from api.models.wrfxctrlAccess.WrfxctrlAccess import WrfxctrlAccess
from api.apiKeys import ADMIN_SERVICES_API_KEY

import api.encryption as encryption

from api.services import UserServices as UserServices
from api.services import AdminServices as AdminServices

from sqlalchemy import select, or_


def find_by_user(user_id):
    return db_session.query(WrfxctrlAccess).filter_by(user_id=user_id).first()


def user_has_access(user):
    if AdminServices.isAdmin(user, ADMIN_SERVICES_API_KEY):
        return True

    encrypted_user_domain = encryption.encrypt_user_data(user.domain())
    any_access_query = select(WrfxctrlAccess).where(
        or_(
            WrfxctrlAccess.user_id == user.id,
            WrfxctrlAccess.encrypted_domain == encrypted_user_domain,
        )
    )
    return db_session.execute(any_access_query).first() != None


def find_by_domain(domain):
    encrypted_domain = encryption.encrypt_user_data(domain)
    return (
        db_session.query(WrfxctrlAccess)
        .filter_by(encrypted_domain=encrypted_domain)
        .first()
    )


def create(permission, user, admin_services_api_key):
    try:
        if not AdminServices.isAdmin(user, admin_services_api_key):
            return None

        if permission[0] == "@":
            return create_for_domain(permission)
        return create_for_user(permission, admin_services_api_key)
    except:
        return None


def create_for_user(email, admin_services_api_key):
    user = UserServices.find_or_create(email, admin_services_api_key)
    new_wrfxctrl_access = find_by_user(user.id)
    if new_wrfxctrl_access:
        return new_wrfxctrl_access
    new_wrfxctrl_access = WrfxctrlAccess(
        user_id=user.id,
    )
    db_session.add(new_wrfxctrl_access)
    db_session.commit()
    return new_wrfxctrl_access


def create_for_domain(domain):
    encrypted_domain = encryption.encrypt_user_data(domain)
    new_wrfxctrl_access = find_by_domain(domain)
    if new_wrfxctrl_access:
        return new_wrfxctrl_access
    new_wrfxctrl_access = WrfxctrlAccess(
        encrypted_domain=encrypted_domain,
    )
    db_session.add(new_wrfxctrl_access)
    db_session.commit()
    return new_wrfxctrl_access


def destroy_for_user(user_id):
    wrfxctrl_access = find_by_user(user_id)
    db_session.delete(wrfxctrl_access)
    db_session.commit()


def destroy_for_domain(domain):
    wrfxctrl_access = find_by_domain(domain)
    db_session.delete(wrfxctrl_access)
    db_session.commit()


def find_all():
    return db_session.query(WrfxctrlAccess).all()


def destroy_all():
    wrfxctrl_accesses = find_all()
    for wrfxctrl_access in wrfxctrl_accesses:
        db_session.delete(wrfxctrl_access)
    db_session.commit()

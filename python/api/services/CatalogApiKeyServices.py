from api.session import db_session
from api.models.catalogApiKey.CatalogApiKey import CatalogApiKey
from api.services import (
    AdminServices as AdminServices,
    CatalogServices as CatalogServices,
)
from api.validators import CatalogValidators as CatalogValidators
import api.logging.utils as loggingUtils
import api.encryption as encryption

import os
import binascii
import datetime


def find_by_catalog_id(catalog_id):
    try:
        validated_catalog_id = CatalogValidators.validate_catalog_id(catalog_id)
        return (
            db_session.query(CatalogApiKey)
            .filter_by(catalog_id=validated_catalog_id)
            .first()
        )
    except:
        return None


def create(catalog_id, user, admin_services_api_key):
    try:
        if not AdminServices.isAdmin(user, admin_services_api_key):
            return None
        api_key = binascii.hexlify(os.urandom(32)).decode()
        catalog = CatalogServices.find_by_id(catalog_id)
        if catalog == None:
            raise ValueError("must provide valid catalog_id")
        encrypted_api_key = encryption.encrypt_api_key(api_key)
        date_created = datetime.datetime.now().strftime("%Y-%m-%d")
        catalog_api_key = CatalogApiKey(
            catalog_id=catalog.id,
            date_created=date_created,
            encrypted_api_key=encrypted_api_key,
        )
        db_session.add(catalog_api_key)
        db_session.commit()
    except Exception as e:
        loggingUtils.service_exception("CatalogApiKey", "create", e)
        return None


def get_api_key(catalog_id, user, admin_services_api_key):
    try:
        if not AdminServices.isAdmin(user, admin_services_api_key):
            raise ValueError(
                f"User {user.id} is not an admin and provide valid admin_api"
            )
        catalog = CatalogServices.find_by_id(catalog_id)
        if catalog == None:
            raise ValueError("must provide valid catalog_id")
        catalog_api_key = find_by_catalog_id(catalog.id)
        return catalog_api_key
    except Exception as e:
        loggingUtils.service_exception("Catalog", "get_api_key", e)
        return None


def refresh_api_key(catalog_id, user, admin_services_api_key):
    try:
        if not AdminServices.isAdmin(user, admin_services_api_key):
            raise ValueError("must provide valid catalog_id")
        catalog_api_key = get_api_key(catalog_id, user, admin_services_api_key)
        if catalog_api_key == None:
            catalog_api_key = create(catalog_id, user, admin_services_api_key)
            return catalog_api_key
        api_key = binascii.hexlify(os.urandom(32)).decode()
        catalog_api_key.encrypted_api_key = encryption.encrypt_api_key(api_key)
        catalog_api_key.date_created = datetime.datetime.now().strftime("%Y-%m-%d")
        db_session.commit()
        return catalog_api_key
    except Exception as e:
        loggingUtils.service_exception("Catalog", "refresh_api_key", e)
        return None

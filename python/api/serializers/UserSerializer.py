from api.services import AdminServices as AdminServices

from api.apiKeys import ADMIN_SERVICES_API_KEY


def serialize_user(user):
    return {
        "id": user.id,
        "date_created": user.date_created,
    }


def serialize_users(users):
    return [serialize_user(user) for user in users]


def serialize_user_with_email(user, current_user, admin_services_api_key):
    current_user_is_admin = AdminServices.isAdmin(current_user, admin_services_api_key)
    valid_admin_access_key = admin_services_api_key == ADMIN_SERVICES_API_KEY
    if not current_user_is_admin or not valid_admin_access_key:
        return serialize_user(user)

    return {
        "id": user.id,
        "date_created": user.date_created,
        "email": user.email(),
    }


def serialize_users_with_emails(users, current_user, user_services_api_access_key):
    return [
        serialize_user_with_email(user, current_user, user_services_api_access_key)
        for user in users
    ]

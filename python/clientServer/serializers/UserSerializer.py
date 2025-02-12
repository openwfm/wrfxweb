from clientServer.services import AdminServices as AdminServices
from flask_login import current_user


def serialize_user(user):
    return {
        "id": user.id,
        "date_created": user.date_created,
    }


def serialize_users(users):
    return [serialize_user(user) for user in users]


def serialize_user_with_email(user):
    if not AdminServices.isAdmin(current_user):
        return serialize_user(user)

    return {
        "id": user.id,
        "date_created": user.date_created,
        "email": user.email(),
    }


def serialize_users_with_emails(users):
    if not AdminServices.isAdmin(current_user):
        return serialize_users(users)
    return [serialize_user_with_email(user) for user in users]

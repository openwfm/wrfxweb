def serialize_user(user):
    return {
        "id": user.id,
        "date_created": user.date_created,
    }


def serialize_users(users):
    return [serialize_user(user) for user in users]

def serialize_user(user):
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "date_created": user.date_created,
    }

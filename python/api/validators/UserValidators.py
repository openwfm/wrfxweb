from api.services import UserServices as UserServices


def validate_user_id(user_id):
    if type(user_id) is not int:
        raise ValueError("User ID must be an integer")

    user = UserServices.find_by_id(user_id)
    if user is None:
        raise ValueError("user_id must be a valid user")

    return user_id

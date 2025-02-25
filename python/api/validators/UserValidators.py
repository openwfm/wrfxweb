from api.services import UserServices as UserServices


def validate_user_id(user_id):
    if type(user_id) is str:
        if not user_id.isdigit():
            raise ValueError("User ID must be an integer")
        user_id = int(user_id)
    if type(user_id) is not int:
        raise ValueError("User ID must be an integer")
    if user_id == 0:
        return 0

    user = UserServices.find_by_id(user_id)
    if user is None:
        raise ValueError("user_id must be a valid user")

    return user_id

def validate_admin_id(admin_id):
    if type(admin_id) is str:
        if not admin_id.isdigit():
            raise ValueError("admin_id must be an integer")
        return int(admin_id)
    if type(admin_id) is not int:
        raise ValueError("admin_id must be an integer")
    return admin_id

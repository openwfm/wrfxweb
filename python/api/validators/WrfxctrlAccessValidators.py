from api.services import WrfxctrlAccessServices as WrfxctrlAccessServices


def validate_wrfxctrl_access_id(wrfxctrl_access_id):
    wrfxctrl_access = WrfxctrlAccessServices.find_by_id(wrfxctrl_access_id)
    if wrfxctrl_access is None:
        raise ValueError("wrfxctrl_access_id must be a valid wrfxctrl_access")

    return wrfxctrl_access

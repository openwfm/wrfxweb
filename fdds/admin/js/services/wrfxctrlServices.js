const WRFXCTRL_URL = "/jobs";

import { postRequest, getRequest, deleteRequest } from "../../../services.js";

export async function createWrfxctrlAccess(create_access_json) {
  const POST_URL = `${WRFXCTRL_URL}/access`;

  let response_json = await postRequest(POST_URL, create_access_json);

  return response_json;
}

export async function getWrfxctrlAccesses() {
  const GET_URL = `${WRFXCTRL_URL}/access`;
  let response_json = await getRequest(GET_URL);

  if (response_json.error) {
    return [];
  }
  return response_json.wrfxctrl_accesses;
}

export async function deleteWrfxctrlAccess(accessId) {
  const DELETE_URL = `${WRFXCTRL_URL}/access/${accessId}`;
  let response_json = await deleteRequest(DELETE_URL);
  return response_json;
}

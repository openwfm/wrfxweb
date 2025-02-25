const ADMIN_URL = "/admin";

import { postRequest, getRequest, deleteRequest } from "../../../services.js";

export async function createAdmin(create_admin_json) {
  const POST_URL = `${ADMIN_URL}/create`;

  let response_json = await postRequest(POST_URL, create_admin_json);

  return response_json;
}

export async function getAdmins() {
  const GET_URL = `${ADMIN_URL}/all`;
  let response_json = await getRequest(GET_URL);

  if (response_json.error) {
    return [];
  }
  return response_json.admins;
}

export async function deleteAdmin(adminId) {
  const DELETE_URL = `${ADMIN_URL}/${adminId}`;
  let response_json = await deleteRequest(DELETE_URL);
  return response_json;
}

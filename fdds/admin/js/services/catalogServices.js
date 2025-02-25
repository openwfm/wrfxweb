const CATALOG_URL = "admin/catalogs";

import {
  postRequest,
  postRequestFormData,
  getRequest,
  deleteRequest,
  updateRequest,
} from "../../../services.js";

export async function createCatalog(create_catalog_json) {
  const POST_URL = `${CATALOG_URL}`;

  const response_json = await postRequest(POST_URL, create_catalog_json);
  return response_json;
}

export async function getCatalogs() {
  const GET_URL = `${CATALOG_URL}/all`;

  const response_json = await getRequest(GET_URL);

  console.log(response_json);
  if (response_json.error) {
    return [];
  }
  console.log("catalogs: ", response_json.catalogs);
  return response_json.catalogs;
}

export async function createCatalogEntry(catalogId, entryParams) {
  const POST_URL = `${CATALOG_URL}/${catalogId}/entries`;

  const response_json = await postRequestFormData(POST_URL, entryParams);

  return response_json;
}

export async function deleteCatalog(catalogId) {
  const DELETE_URL = `${CATALOG_URL}/${catalogId}`;

  const response_json = await deleteRequest(DELETE_URL);
  return response_json;
}

export async function getPermissionsForCatalog(catalogId) {
  const GET_URL = `${CATALOG_URL}/${catalogId}/permissions/all`;

  const response_json = await getRequest(GET_URL);
  if (response_json.error) {
    return [];
  }
  return response_json.permissions;
}

export async function updateCatalog(catalogId, catalogParams) {
  const PATCH_URL = `${CATALOG_URL}/${catalogId}`;

  const response_json = await updateRequest(PATCH_URL, catalogParams);

  return response_json;
}

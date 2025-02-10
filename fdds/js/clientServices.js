import { getRequest } from "../services.js";

const CATALOG_URL = "/catalogs";

export async function getCatalogs() {
  const GET_URL = CATALOG_URL;

  const response_json = await getRequest(GET_URL);

  if (response_json.error) {
    return [];
  }
  console.log("catalogs: ", response_json.catalogs);
  return response_json.catalogs;
}

export async function getCatalogEntries(catalogId) {
  let GET_URL = `${CATALOG_URL}/${catalogId}/catalog_json`;

  const response_json = await getRequest(GET_URL);

  if (response_json.error) {
    return {};
  }

  console.log("catalog entries: ", response_json);
  return response_json;
}

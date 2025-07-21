import { getRequest } from "../services.js";

export const CATALOG_URL = "/catalogs";

export async function getCatalogs() {
  const GET_URL = CATALOG_URL;

  const response_json = await getRequest(GET_URL);

  if (response_json.error) {
    return [];
  }
  return response_json.catalogs;
}

export async function getCatalogEntries(catalogId) {
  let GET_URL = `${CATALOG_URL}/${catalogId}/entries`;

  const response_json = await getRequest(GET_URL);

  if (response_json.error) {
    return {};
  }

  return response_json;
}

/** Service request for fetching a selected simulation from the menu. */
export async function getSimulation(catalogId, entryId) {
  let GET_URL = `${CATALOG_URL}/${catalogId}/entries/${entryId}/rasters`;
  const response_json = await getRequest(GET_URL);

  if (response_json.error) {
    return {};
  }
  return response_json;
}

/** Service request for downloading zip link from catalogItem. */
export async function getZip(catalogId, entryId) {
  let GET_URL = `${CATALOG_URL}/${catalogId}/entries/${entryId}/zip`;
  const response_json = await getRequest(GET_URL);

  if (response_json.error) {
    return {};
  }
  return response_json;
}

/** Service request for downloading kml link from catalogItem. */
export async function getKml(catalogId, entryId) {
  let GET_URL = `${CATALOG_URL}/${catalogId}/entries/${entryId}/zip`;
  const response_json = await getRequest(GET_URL);

  if (response_json.error) {
    return {};
  }
  return response_json;
}

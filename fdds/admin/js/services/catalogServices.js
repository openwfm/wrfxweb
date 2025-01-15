const CATALOG_URL = "admin/catalogs";

async function postRequest(request_url, request_json) {
  let response_json = {};

  try {
    const response = await fetch(request_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request_json),
    });
    if (response.status !== 200) {
      throw new Error(response_json.message);
    }
    response_json = await response.json();
    return response_json;
  } catch (error) {
    console.error("Error:", error);
    return { error: error };
  }
}

async function getRequest(request_url) {
  let response_json = {};

  try {
    const response = await fetch(request_url);
    if (response.status !== 200) {
      throw new Error(response_json.message);
    }
    response_json = await response.json();
    return response_json;
  } catch (error) {
    console.error("Error:", error);
    return { error: error };
  }
}

async function deleteRequest(request_url) {
  let response_json = {};

  try {
    const response = await fetch(request_url, {
      method: "DELETE",
    });
    if (response.status !== 200) {
      throw new Error(response_json.message);
    }
    response_json = await response.json();
    return response_json;
  } catch (error) {
    console.error("Error:", error);
    return { error: error };
  }
}

export async function createCatalog(create_catalog_json) {
  const POST_URL = `${CATALOG_URL}`;

  const response_json = await postRequest(POST_URL, create_catalog_json);
  return response_json;
}

export async function getCatalogs() {
  const GET_URL = `${CATALOG_URL}/all`;

  const response_json = await getRequest(GET_URL);

  if (response_json.error) {
    return [];
  }
  console.log("catalogs: ", response_json.catalogs);
  return response_json.catalogs;
}

export async function createCatalogEntry(catalogId, entryParams) {
  const POST_URL = `${CATALOG_URL}/${catalogId}/entries`;

  const response_json = await postRequest(POST_URL, entryParams);

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
  let response_json = {};

  try {
    const response = await fetch(PATCH_URL, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(catalogParams),
    });
    if (response.status !== 200) {
      throw new Error(response_json.message);
    }
    response_json = await response.json();
    return response_json;
  } catch (error) {
    console.error("Error:", error);
    return { error: error };
  }
}

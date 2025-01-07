const CATALOG_URL = "admin/catalogs";

export async function createCatalog(create_catalog_json) {
  const POST_URL = `${CATALOG_URL}`;
  let response_json = {};

  try {
    const response = await fetch(POST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(create_catalog_json),
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

export async function getCatalogs() {
  const GET_URL = `${CATALOG_URL}/all`;
  let response_json = {};

  try {
    const response = await fetch(GET_URL);
    if (response.status !== 200) {
      throw new Error(response_json.message);
    }
    response_json = await response.json();
    return response_json.catalogs;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

export async function deleteCatalog(catalogId) {
  const DELETE_URL = `${CATALOG_URL}/${catalogId}`;
  let response_json = {};

  try {
    const response = await fetch(DELETE_URL, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.status !== 200) {
      throw new Error(response_json.message);
    }
    response_json = await response.json();
    return response_json;
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function getPermissionsForCatalog(catalogId) {
  const GET_URL = `${CATALOG_URL}/${catalogId}/permissions/all`;
  let response_json = {};

  try {
    const response = await fetch(GET_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.status !== 200) {
      throw new Error(response_json.message);
    }
    response_json = await response.json();
    return response_json.permissions;
  } catch (error) {
    console.error("Error:", error);
  }
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

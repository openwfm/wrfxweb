const CATALOG_URL = "admin/catalogs";

export async function createCatalog(create_catalog_json) {
  const POST_URL = `${CATALOG_URL}/create`;
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
  const DELETE_URL = `${CATALOG_URL}/delete/${catalogId}`;
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

export async function createPermissionForUser(permission) {
  const { catalogId, email } = permission;
  const CREATE_URL = `${CATALOG_URL}/${catalogId}/permissions/create/users/${email}`;
  let response_json = {};

  try {
    const response = await fetch(CREATE_URL, {
      method: "POST",
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

export async function createPermissionForDomain(permission) {
  const { catalogId, domain } = permission;
  const CREATE_URL = `${CATALOG_URL}/${catalogId}/permissions/create/domain/${domain}`;
  let response_json = {};

  try {
    const response = await fetch(CREATE_URL, {
      method: "POST",
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

export async function deletePermissionForUser(permission) {
  const { userid, catalogid } = permission;
  const delete_url = `${CATALOG_URL}/${catalogid}/permissions/delete/users/${userid}`;
  let response_json = {};

  try {
    const response = await fetch(delete_url, {
      method: "delete",
      headers: {
        "content-type": "application/json",
      },
    });
    if (response.status !== 200) {
      throw new error(response_json.message);
    }
    response_json = await response.json();
    return response_json;
  } catch (error) {
    console.error("error:", error);
  }
}

export async function deletePermissionForDomain(permission) {
  const { catalogid, domain } = permission;
  const DELETE_URL = `${CATALOG_URL}/${catalogid}/permissions/delete/domain/${domain}`;
  let response_json = {};

  try {
    const response = await fetch(DELETE_URL, {
      method: "delete",
      headers: {
        "content-type": "application/json",
      },
    });
    if (response.status !== 200) {
      throw new error(response_json.message);
    }
    response_json = await response.json();
    return response_json;
  } catch (error) {
    console.error("error:", error);
  }
}

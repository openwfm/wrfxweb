const ADMIN_URL = "/admin";

export async function createAdmin(create_admin_json) {
  const POST_URL = `${ADMIN_URL}/create`;
  let response_json = {};

  try {
    const response = await fetch(POST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(create_admin_json),
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

export async function getAdmins() {
  const GET_URL = `${ADMIN_URL}/all`;
  let response_json = {};

  try {
    const response = await fetch(GET_URL);
    if (response.status !== 200) {
      throw new Error(response_json.message);
    }
    response_json = await response.json();
    return response_json.admins;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

export async function deleteAdmin(adminEmail) {
  const DELETE_URL = `${ADMIN_URL}/delete`;
  let response_json = {};

  try {
    const response = await fetch(DELETE_URL, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: adminEmail }),
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

export async function createAdmin(create_admin_json) {
  const POST_URL = "/admin/create";
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
  }
}

export async function getAdmins() {
  const GET_URL = "/admin/all";
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
  const DELETE_URL = `/admin/delete`;
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

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

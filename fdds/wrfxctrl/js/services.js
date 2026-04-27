/** Service request for building the initial catalogMenu */
export async function getCatalogEntries() {
  let json = {};
  try {
    const response = await fetch("/catalogs/no_entries");
    json = await response.json();
  } catch (error) {
    console.error("Error fetching catalog entries: " + error);
    return [];
  }
  return json.catalogs;
}

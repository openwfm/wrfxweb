export async function fetchPerimeterKML(formData) {
  const FETCH_URL = '/upload_perimeter';

  let kmlData = [];
  try {
    const fetchBody = { method: 'POST', body: formData }
    await fetch(FETCH_URL, fetchBody).then(response => response.json()).then(function(response_json) {
      kmlData = response_json.data;
    });
  } catch(error) {
      console.error(`Error fetching data for KML: ${error}`);
  }
  return kmlData;
}

export async function fetchLineKML(formData) {
  const FETCH_URL = '/upload_line';

  let kmlData = [];
  try {
    const fetchBody = { method: 'POST', body: formData }
    await fetch(FETCH_URL, fetchBody).then(response => response.json()).then(function(response_json) {
      kmlData = response_json.data;
    });
  } catch(error) {
      console.error(`Error fetching data for KML: ${error}`);
  }
  return kmlData;
}

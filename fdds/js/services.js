import { controllers } from "./components/Controller.js";
import { simVars } from "./simVars.js";

/** Service request for fetching the conf.json file. */
export async function getConfigurations() {
  await fetch("conf")
    .then((response) => response.json())
    .then(function(configData) {
      if (configData.organization) {
        simVars.organization = configData.organization;
      }
      document.title = simVars.organization;

      if (configData.flags) {
        const simulationFlags = document.querySelector("#simulation-flags");
        let flags = configData.flags;
        flags.map((flag) => {
          let spanElement = document.createElement("span");
          spanElement.className = "displayTest";
          spanElement.innerText = flag;
          simulationFlags.appendChild(spanElement);
        });
      }
    })
    .catch((error) => {
      console.error("Error fetching conf.json : " + error);
    });
}

/** Service request for building the initial catalogMenu */
export async function getCatalogEntries() {
  let json = {};
  try {
    const response = await fetch("simulations/catalog.json");
    //const response = await fetch(catalogUrl);
    json = await response.json();
  } catch (error) {
    console.error("Error fetching catalog entries: " + error);
  }
  return json;
}

/** Service request for fetching a selected simulation from the menu. */
export function getSimulation(path) {
  fetch(path)
    .then((response) => response.json())
    .then(function(selectedSimulation) {
      // store in global state
      simVars.rasters = selectedSimulation;
      simVars.rasterBase = path.substring(0, path.lastIndexOf("/") + 1);
      // retrieve all domains
      controllers.domainInstance.setValue(Object.keys(selectedSimulation));
    })
    .catch((error) => {
      console.error("Error fetching simulation at " + path);
      console.log(error);
    });
}

export async function createUser(formData) {
  const POST_URL = "/create_user";
  let json = {};
  try {
    const response = await fetch(POST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    json = await response.json();
    if (!response.ok) {
      throw new Error(json.message);
    }
    return json;
  } catch (error) {
    return { error: error.message };
    //alert(`Error submitting issue: ${error.message}`);
  }
}

export async function login(formData) {
  const POST_URL = "/login";
  let json = {};
  try {
    const response = await fetch(POST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    json = await response.json();
    if (!response.ok) {
      throw new Error(json.message);
    }
    return json;
  } catch (error) {
    return { error: error.message };
    //alert(`Error submitting issue: ${error.message}`);
  }
}

export async function loginGoogle() {
  const POST_URL = "/login/google";
  let json = {};
  try {
    const response = await fetch(POST_URL, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
    json = await response.json();
    if (!response.ok) {
      throw new Error(json.message);
    }
    console.log("Google login response: ", json);
    return json;
  } catch (error) {
    return { error: error.message };
  }
}

export async function submitIssue(formData) {
  const POST_URL = "/submit_issue";
  let json = {};
  try {
    const response = await fetch(POST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    json = await response.json();
    if (response.status == 429) {
      throw new Error(
        "We are currently experiencing a high volume of issue reports. Please try again tomorrow.",
      );
    } else if (!response.ok) {
      throw new Error(
        "An error occurred while submitting your issue. Please try again",
      );
    }
  } catch (error) {
    alert(`Error submitting issue: ${error.message}`);
    return;
  }
  alert("Thank you for submitting your feedback!");
}

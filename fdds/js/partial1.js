"use strict";
import { getConfigurations } from "./services.js";
import { map } from "./util.js";
import { organization } from "./components/Controller.js";

window.onload = () => {
  map.doubleClickZoom.disable();
  map.scrollWheelZoom.disable();

  loadConfig();

  // add scale & zoom controls to the map
  L.control.scale({ position: 'bottomright' }).addTo(map);
}

/** Function that retrieves conf.json and sets the document title and flags if they exist. */
async function loadConfig() {
  var configData = await getConfigurations();
  if (configData.organization) {
    organization.setValue(configData.organization);
    if (!organization.getValue().includes("SJSU")) {
        map.panTo([39.7392, -104.9903]);
    }
    document.title = organization.getValue();
  }

  if (configData.flags) {
    let flags = configData.flags;
    const simulationFlags = document.querySelector("#simulation-flags");
    flags.map(flag => {
        var spanElement = document.createElement("span");
        spanElement.className = "displayTest";
        spanElement.innerText = flag;
        simulationFlags.appendChild(spanElement);
    });
  }
}

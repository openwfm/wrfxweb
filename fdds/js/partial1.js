'use strict';
import { getConfigurations } from './services.js';
import { map, simVars } from './util.js';

window.onload = () => {
  loadConfig();
}

/** Function that retrieves conf.json and sets the document title and flags if they exist. */
async function loadConfig() {
  var configData = await getConfigurations();

  if (configData.organization) {
    simVars.organization = configData.organization;
    if (!simVars.organization.includes('SJSU')) {
        map.panTo([39.7392, -104.9903]);
    }
    document.title = simVars.organization;
  }

  if (configData.flags) {
    const simulationFlags = document.querySelector('#simulation-flags');
    var flags = configData.flags;
    flags.map(flag => {
        var spanElement = document.createElement('span');
        spanElement.className = 'displayTest';
        spanElement.innerText = flag;
        simulationFlags.appendChild(spanElement);
    });
  }

}

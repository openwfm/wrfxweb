import { controllers } from './components/Controller.js';
import { simVars } from './util.js';

/** Service request for fetching the conf.json file. */
export async function getConfigurations() {
    fetch('conf.json').then(response => response.json()).then(function(configData) {
        if (configData.organization) {
            simVars.organization = configData.organization;
        }
        document.title = simVars.organization;
    
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
    }).catch(error => {
        console.error('Error fetching conf.json : ' + error);
    });
}

/** Service request for building the initial catalogMenu */
export async function getCatalogEntries() {
    let json = {};
    try {
        const response = await fetch('simulations/catalog.json');
        json = response.json();
    } catch(error) {
        console.error('Error fetching catalog entries: ' + error);
    }
    return json;
}

/** Service request for fetching a selected simulation from the menu. */
export function getSimulation(path) {
    fetch(path).then(response => response.json()).then(function(selectedSimulation) { 
        // store in global state
        simVars.rasters = selectedSimulation;
        simVars.rasterBase = path.substring(0, path.lastIndexOf('/') + 1);
        // retrieve all domains
        controllers.domainInstance.setValue(Object.keys(selectedSimulation));
    }).catch(error => {
        console.error('Error fetching simulation at ' + path + ': ' + error);
    });
}

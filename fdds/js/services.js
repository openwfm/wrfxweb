import { controllers } from './components/Controller.js';
import { simVars } from './util.js';
/** Service request for fetching the conf.json file. */
export async function getConfigurations() {
    let json = {};
    try {
        const response = await fetch('conf.json');
        json = response.json();
    } catch(error) {
        console.error('Error fetching conf.json: ' + error);
    }
    return json;
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
    // fetch(path).then(response => response.json()).then(function(selectedSimulation) { 
    fetch(path.replaceAll(':', '_')).then(response => response.json()).then(function(selectedSimulation) {
        // store in global state
        simVars.rasters = selectedSimulation;
        // simVars.rasterBase = path.substring(0, path.lastIndexOf('/') + 1);
        simVars.rasterBase = path.replaceAll(':', '_').substring(0, path.lastIndexOf('/') + 1);
        // retrieve all domains
        controllers.domainInstance.setValue(Object.keys(selectedSimulation));
    }).catch(error => {
        console.error('Error fetching simulation at ' + path + ': ' + error);
    });
}

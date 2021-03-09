import {rasters, raster_base, domainInstance} from './components/Controller.js';
/** Service request for fetching the conf.json file. */
export async function getConfigurations() {
    let json = {};
    try {
        const response = await fetch('conf.json');
        json = response.json();
    } catch(error) {
        console.error("Error fetching conf.json: " + error);
    }
    return json;
}

/** Service request for building the initial catalogMenu */
export async function getCatalogEntries() {
    let json = {};
    try {
        const response = await fetch("simulations/catalog.json");
        json = response.json();
    } catch(error) {
        console.error("Error fetching catalog entries: " + error);
    }
    return json;
}

/** Service request for fetching a selected simulation from the menu. */
export function getSimulation(path) {
    fetch(path.replaceAll(":", "_")).then(response => response.json()).then(function(selectedSimulation) { 
    // fetch(path).then(response => response.json()).then(function(selectedSimulation) { 
        // store in global state
        rasters.setValue(selectedSimulation);
        // raster_base.setValue(path.substring(0, path.lastIndexOf('/') + 1));
        // raster_base.setValue("https://demo.openwfm.org/ch/" + path.substring(0, path.lastIndexOf('/') + 1));
        raster_base.setValue(path.replaceAll(":", "_").substring(0, path.lastIndexOf('/') + 1));
        // retrieve all domains
        domainInstance.setValue(Object.keys(selectedSimulation));
    }).catch(error => {
        console.error("Error fetching simulation at " + path + ": " + error);
    });
}

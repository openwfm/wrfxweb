/** Service request for fetching the conf.json file. */
export async function getConfigurations() {
    let configurationData = {
        organization: '',
        flags: [],
    }; 
    await fetch('conf.json').then(response => response.json()).then(function(configData) {
        configurationData = configData;
    }).catch(error => {
        console.error('Error fetching conf.json : ' + error);
    });
    return configurationData;
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
export async function getSimulationRasters(path) {
    let simulationRasters;
    // await fetch(path).then(response => response.json()).then(function(selectedSimulation) { 
    await fetch(path.replaceAll(':', '_')).then(response => response.json()).then(function(selectedSimulation) {
        simulationRasters = selectedSimulation;
    }).catch(error => {
        console.error('Error fetching simulation at ' + path);
        console.log(error);
    });
    return simulationRasters;
}
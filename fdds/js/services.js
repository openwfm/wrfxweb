import { controllers } from './components/Controller.js';
import { simVars } from './simVars.js';

/** Service request for fetching the conf.json file. */
export async function getConfigurations() {
    await fetch('conf.json').then(response => response.json()).then(function(configData) {
        if (configData.organization) {
            simVars.organization = configData.organization;
        }
        document.title = simVars.organization;
    
        if (configData.flags) {
            const simulationFlags = document.querySelector('#simulation-flags');
            let flags = configData.flags;
            flags.map(flag => {
                let spanElement = document.createElement('span');
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
    // fetch(path).then(response => response.json()).then(function(selectedSimulation) { 
    fetch(path.replaceAll(':', '_')).then(response => response.json()).then(function(selectedSimulation) {
        // store in global state
        simVars.rasters = selectedSimulation;
        // let rasterBase = path.substring(0, path.lastIndexOf('/') + 1);
        let rasterBase = path.replaceAll(':', '_').substring(0, path.lastIndexOf('/') + 1);
        simVars.rasterBase = rasterBase;
        // retrieve all domains
        let domainInstances = Object.keys(selectedSimulation);

        let simInfo = simVars.simInfos[simVars.currentDescription];
        simVars.simInfos[simVars.currentDescription] = {
            ...simInfo,
            domainInstance: domainInstances,
            rasterBase: rasterBase,
            rasters: selectedSimulation,
        };

        controllers.addedSimulations.add(simVars.currentDescription);
        controllers.domainInstance.setValue(domainInstances);
    }).catch(error => {
        console.error('Error fetching simulation at ' + path);
        console.log(error);
    });
}
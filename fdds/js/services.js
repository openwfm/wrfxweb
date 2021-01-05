/** Class that handles any required fetching or asynchronous requests. */
class Services {
    /** Service request for building the initial catalogMenu */
    async getCatalogEntries() {
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
    getSimulation(path) {
        fetch(path.replaceAll(":", "_")).then(response => response.json()).then(function(selectedSimulation) { 
        // fetch(path).then(response => response.json()).then(function(selectedSimulation) { 
            // store in global state
            rasters = selectedSimulation;
            // raster_base = path.substring(0, path.lastIndexOf('/') + 1);
            raster_base = "https://demo.openwfm.org/sj/" + path.substring(0, path.lastIndexOf('/') + 1);
            // retrieve all domains
            domainInstance.setValue(Object.keys(rasters));
        }).catch(error => {
            console.error("Error fetching simulation at " + path + ": " + error);
        });
    }
}

const services = new Services();
class Services {
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

    getSimulation(path) {
        fetch(path.replaceAll(":", "_")).then(response => response.json()).then(function(selected_simulation) { 
        // fetch(path).then(response => response.json()).then(function(selected_simulation) { 
            // store in global state
            rasters = selected_simulation;
            // raster_base = path.substring(0, path.lastIndexOf('/') + 1);
            raster_base = "https://demo.openwfm.org/sj/" + path.substring(0, path.lastIndexOf('/') + 1);
            // retrieve all domains
            domainInstance.setValue(Object.keys(rasters));
        }).catch(error => {
            console.log(error);
        });
    }
}

const services = new Services();
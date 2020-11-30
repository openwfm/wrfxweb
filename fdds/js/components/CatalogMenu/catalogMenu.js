/**
 * A Component that builds the CatalogMenu. Can be added to html using <catalog-menu></catalog-menu> 
 * 
 * Includes three different columns for data related to fires, fuel moisture, and satellite data. 
 * Can be moved around by clicking the title bar, can be closed by clicking x in top right corner, and 
 * supports searching columns for data that matches a description.
 */
class CatalogMenu extends HTMLElement {
    constructor() {
        super();
        // Arrays of catalog entries based on their descriptions.
        this.firesList = [];
        this.fuelMoistureList = [];
        this.satelliteList = [];
        this.innerHTML = `
            <div class="catalog-menu">
                <div id="menu-title" class="menu-title">
                    <h3>Select Simulation...</h3>
                    <div> 
                        <input id="menu-search" type="text" placeholder="Search for Simulation..."></input>
                        <span id="menu-close">x</span>
                    </div>
                </div>
                <div class="menu-columns">
                    <div class="column">
                        <h3>Fires</h3>
                        <ul id="catalog-fires" class="catalog-list"> </ul>
                    </div>
                    <div class="column">
                        <h3>Fuel moisture</h3>
                        <ul id="catalog-fuel-moisture" class="catalog-list"> </ul>
                    </div>
                    <div class="column">
                        <h3>Satellite Data</h3>
                        <ul id="catalog-satellite-data" class="catalog-list"> </ul>
                    </div>
                </div>
                <div class="menu-columns-mobile">
                    <div class="column">
                        <select id="mobile-selector">
                            <option value="Fires">Fires</option>
                            <option value="Fuel Moisture">Fuel Moisture</option>
                            <option value="Satellite Data">Satellite Data</option>
                        </select>
                        <div id="catalog-mobile-list">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * This function is called once the HTML Element has been added to the DOM. This is when the json 
     * needs to be fetched and the lists built 
     */
    connectedCallback() {
        const catalogMenu = this.querySelector('.catalog-menu');
        // Makes sure that map events like zooming and panning are disabled from within menu div
        L.DomEvent.disableScrollPropagation(catalogMenu);
        L.DomEvent.disableClickPropagation(catalogMenu);
        // Closes the menu when the x is clicked
        this.querySelector('#menu-close').addEventListener('click', () => {
            catalogMenu.style.display = 'none';
        });
        // Implements repositioning menu
        this.dragElement(catalogMenu);

        const menuSearch = this.querySelector('#menu-search');
        // Make sure the menu can't be dragged from the search input box
        menuSearch.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        // Sets up search functionality
        menuSearch.oninput = () => this.searchCatalog();

        const menuSelect = this.querySelector('#mobile-selector');
        menuSelect.onchange = () => this.selectCategory(menuSelect.value);

        const urlParams = new URLSearchParams(window.location.search);
        const navJobId = urlParams.get('job_id');

        // needed for proper function scoping
        var parentComponent = this;
        // fetch catalog
        fetch("simulations/catalog.json").then(response => response.json()).then(function(data) { 
            const firesListDOM = parentComponent.querySelector('#catalog-fires');
            const fuelMoistureListDOM = parentComponent.querySelector('#catalog-fuel-moisture');
            const satelliteListDOM = parentComponent.querySelector('#catalog-satellite-data');
            const mobileListDOM = parentComponent.querySelector('#catalog-mobile-list');
            // build html for list item for each catalog entry and add it to the proper list depending on its description
            for (const [cat_name, cat_entry] of Object.entries(data)) {
                let desc = cat_entry.description;
                var newLI = parentComponent.buildListItem(cat_entry, navJobId);
                if(desc.indexOf('GACC') >= 0) {
                    parentComponent.fuelMoistureList.push(cat_entry);
                    fuelMoistureListDOM.appendChild(newLI);
                } else if(desc.indexOf('SAT') >= 0) {
                    parentComponent.satelliteList.push(cat_entry);
                    satelliteListDOM.appendChild(newLI);
                } else {
                    parentComponent.firesList.push(cat_entry);
                    firesListDOM.appendChild(newLI);
                }
            }
            mobileListDOM.appendChild(firesListDOM.cloneNode(true));
            
        }).catch(error => {
            console.log(error);
        });
    }

    /** Returns <li> html element from a given catalog entry */
    buildListItem(cat_entry, navJobId) {
        const newLI = document.createElement('catalog-item');
        newLI.setAttribute('description', cat_entry.description);
        newLI.setAttribute('manifestPath', cat_entry.manifest_path);
        newLI.setAttribute('jobId', cat_entry.job_id);
        newLI.setAttribute('to', cat_entry.to_utc);
        newLI.setAttribute('from', cat_entry.from_utc);
        newLI.setAttribute('navJobId', navJobId);
        if (cat_entry.kml_url) {
            newLI.setAttribute('kmlURL', cat_entry.kml_url);
            newLI.setAttribute('kmlSize', cat_entry.kml_size);
        }
        if (cat_entry.zip_url) {
            newLI.setAttribute('zipURL', cat_entry.zip_url);
            newLI.setAttribute('zipSize', cat_entry.zip_size);
        }
        return newLI;
    }

    /** Called each time a character is entered into the search input. Clears each catalog column on the DOM,
     * filters the stored array of catalog entries by its description for whether there is a match with the searched
     * text. Builds <li> html for filtered catalog entries and adds them to the columns
    */
    searchCatalog() {
        const searchText = this.querySelector('#menu-search').value.toLowerCase();
        const firesListDOM = this.querySelector('#catalog-fires');
        const fuelMoistureListDOM = this.querySelector('#catalog-fuel-moisture');
        const satelliteListDOM = this.querySelector('#catalog-satellite-data');
        let catalogColumns = [[firesListDOM, this.firesList], [fuelMoistureListDOM, this.fuelMoistureList], [satelliteListDOM, this.satelliteList]];
        catalogColumns.map(columnArray => {
            let listDOM = columnArray[0];
            let list = columnArray[1];
            listDOM.innerHTML = '';
            let filteredList = list.filter(catalogEntry => catalogEntry.description.toLowerCase().includes(searchText));
            filteredList.map(catalogEntry => {
                let matchedLI = this.buildListItem(catalogEntry);
                listDOM.appendChild(matchedLI);
            });
        });
    }

    selectCategory(selection) {
        console.log(selection);
        const mobileListDOM = this.querySelector('#catalog-mobile-list');
        mobileListDOM.innerHTML = '';
        if (selection == 'Fires') {
            const firesListDOM = this.querySelector('#catalog-fires');
            mobileListDOM.appendChild(firesListDOM.cloneNode(true));
        } else if (selection == 'Fuel Moisture') {
            const fuelMoistureListDOM = this.querySelector('#catalog-fuel-moisture');
            mobileListDOM.appendChild(fuelMoistureListDOM.cloneNode(true));
        } else {
            const satelliteListDOM = this.querySelector('#catalog-satellite-data');
            mobileListDOM.appendChild(satelliteListDOM.cloneNode(true));
        }
    }

    /** Makes given element draggable */
    dragElement(elmnt) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        document.getElementById(elmnt.id + "menu-title").onpointerdown = dragMouseDown;
      
        function dragMouseDown(e) {
          e = e || window.event;
          e.preventDefault();
          e.stopPropagation();
          // get the mouse cursor position at startup:
          pos3 = e.clientX;
          pos4 = e.clientY;
          document.onpointerup = closeDragElement;
          // call a function whenever the cursor moves:
          document.onpointermove = elementDrag;
        }
      
        function elementDrag(e) {
          e = e || window.event;
          e.preventDefault();
          e.stopPropagation();
          // calculate the new cursor position:
          pos1 = pos3 - e.clientX;
          pos2 = pos4 - e.clientY;
          pos3 = e.clientX;
          pos4 = e.clientY;
          // set the element's new position:
          elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
          elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }
      
        function closeDragElement() {
          // stop moving when mouse button is released:
          document.onpointerup = null;
          document.onpointermove = null;
        }
    }

    /** Called when Component is removed from the DOM. Remove EventListners */
    disconnectedCallback() {
        this.querySelector('#menu-close').removeEventListener();
        this.querySelector('#menu-search').removeEventListener();
    }
}

window.customElements.define('catalog-menu', CatalogMenu);
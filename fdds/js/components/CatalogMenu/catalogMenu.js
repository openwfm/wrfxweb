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
        this.addOrder = {};
        this.innerHTML = `
            <div class="catalog-menu">
                <div id="menu-title" class="menu-title">
                    <h3>Select Simulation...</h3>
                    <div> 
                        <span id="menu-close">x</span>
                    </div>
                </div>
                <div class="search-header">
                    <div class="search-header-block">
                        <label for="sort-by" style="display: block; font-size:.75rem">order/search by</label>
                        <select id="sort-by" class="selector">
                            <option value="original-order">original order</option>
                            <option value="description">description</option>
                            <option value="start-date">start date</option>
                            <option value="end-date">end date</option>
                        </select>
                    </div>
                    <div class="search-header-block">
                        <label id="reverse-label" for="reverse-order">Reverse Order</label>
                        <input type="checkbox" id="reverse-order" style="display:inline-block"></input>
                    </div>
                    <div class="search-header-block">
                        <input id="search-for" class="menu-search" type="text"></input>
                    </div>
                </div>
                <div class="menu-columns">
                    <select id="mobile-selector">
                        <option value="Fires">Fires</option>
                        <option value="Fuel Moisture">Fuel Moisture</option>
                        <option value="Satellite Data">Satellite Data</option>
                    </select>
                    <div id="fires-column" class="column">
                        <h3 class="column-header">Fires</h3>
                        <ul id="catalog-fires" class="catalog-list"> </ul>
                    </div>
                    <div id="fuel-moisture-column" class="column">
                        <h3 class="column-header">Fuel moisture</h3>
                        <ul id="catalog-fuel-moisture" class="catalog-list"> </ul>
                    </div>
                    <div id="satellite-column" class="column">
                        <h3 class="column-header">Satellite Data</h3>
                        <ul id="catalog-satellite-data" class="catalog-list"> </ul>
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
        const clientWidth = document.body.clientWidth;
        const sortBy = this.querySelector('#sort-by');
        const reverseOrder = this.querySelector('#reverse-order');
        const reverseLabel = this.querySelector('#reverse-label');
        const menuSearch = this.querySelector('#search-for');
        reverseLabel.innerText = (clientWidth < 769) ? "Reverse" : "Reverse Order";
        sortBy.onchange = () => this.sortBy(sortBy.value, reverseOrder.checked);
        reverseOrder.onclick = () => this.sortBy(sortBy.value, reverseOrder.checked);
        catalogMenu.style.right = ((clientWidth - catalogMenu.clientWidth)/ 2) + "px";
        var searchDescription = (clientWidth < 769) ? "Search..." : "Search for Simulation...";
        // Makes sure that map events like zooming and panning are disabled from within menu div
        L.DomEvent.disableScrollPropagation(catalogMenu);
        L.DomEvent.disableClickPropagation(catalogMenu);
        // Closes the menu when the x is clicked
        this.querySelector('#menu-close').addEventListener('click', () => {
            catalogMenu.style.display = 'none';
        });
        // Implements repositioning menu
        dragElement(catalogMenu, "menu-title");
        menuSearch.placeholder = searchDescription;
        menuSearch.onpointerdown = (e) => e.stopPropagation();
        // Sets up search functionality
        menuSearch.oninput = () => this.searchCatalog(menuSearch.value.toLowerCase(), sortBy.value);

        const menuSelect = this.querySelector('#mobile-selector');
        menuSelect.onchange = () => this.selectCategory(menuSelect.value);

        this.buildMenu();
    }

    async buildMenu() {
        const urlParams = new URLSearchParams(window.location.search);
        const navJobId = urlParams.get('job_id');
        const firesListDOM = this.querySelector('#catalog-fires');
        const fuelMoistureListDOM = this.querySelector('#catalog-fuel-moisture');
        const satelliteListDOM = this.querySelector('#catalog-satellite-data');
        let c = 0;
        // build html for list item for each catalog entry and add it to the proper list depending on its description
        const catalogEntries = await services.getCatalogEntries();
        for (const [cat_name, cat_entry] of Object.entries(catalogEntries)) {
            this.addOrder[cat_entry.job_id] = c;
            c += 1;
            let desc = cat_entry.description;
            var newLI = new CatalogItem(cat_entry, navJobId);
            if(desc.indexOf('GACC') >= 0) {
                this.fuelMoistureList.push(cat_entry);
                fuelMoistureListDOM.appendChild(newLI);
            } else if(desc.indexOf('SAT') >= 0) {
                this.satelliteList.push(cat_entry);
                satelliteListDOM.appendChild(newLI);
            } else {
                this.firesList.push(cat_entry);
                firesListDOM.appendChild(newLI);
            }
        }
    }

    /** Called each time a character is entered into the search input. Clears each catalog column on the DOM,
     * filters the stored array of catalog entries by its description for whether there is a match with the searched
     * text. Builds <li> html for filtered catalog entries and adds them to the columns
    */
    searchCatalog(searchText, sortBy) {
        const firesListDOM = this.querySelector('#catalog-fires');
        const fuelMoistureListDOM = this.querySelector('#catalog-fuel-moisture');
        const satelliteListDOM = this.querySelector('#catalog-satellite-data');
        let catalogColumns = [[firesListDOM, this.firesList], [fuelMoistureListDOM, this.fuelMoistureList], [satelliteListDOM, this.satelliteList]];
        var filterFunction = (catalogEntry) => {
            if (sortBy == 'original-order' || sortBy == 'description') return catalogEntry.description.toLowerCase().includes(searchText);
            if (sortBy.includes('start-date')) return catalogEntry.from_utc.toLowerCase().includes(searchText);
            if (sortBy.includes('end-date')) return catalogEntry.to_utc.toLowerCase().includes(searchText);
        }
        catalogColumns.map(([listDOM, list]) => {
            listDOM.innerHTML = '';
            let filteredList = list.filter(filterFunction);
            filteredList.map(catalogEntry => {
                let matchedLI = new CatalogItem(catalogEntry, null);
                listDOM.appendChild(matchedLI);
            });
        });
    }

    sortBy(sortBy, reverseOrder) {
        const firesListDOM = this.querySelector('#catalog-fires');
        const fuelMoistureListDOM = this.querySelector('#catalog-fuel-moisture');
        const satelliteListDOM = this.querySelector('#catalog-satellite-data');
        var sortingFunction = (listElem1, listElem2) => {
            let result = false;
            if (sortBy == "original-order") result = this.addOrder[listElem1.job_id] > this.addOrder[listElem2.job_id];
            if (sortBy == "description") result = listElem1.description > listElem2.description; 
            if (sortBy == "start-date") result = listElem1.from_utc > listElem2.from_utc;
            if (sortBy == "end-date") result = listElem1.to_utc > listElem2.to_utc;
            if (reverseOrder) return !result;
            return result;
        }
        let catalogColumns = [[firesListDOM, this.firesList], [fuelMoistureListDOM, this.fuelMoistureList], [satelliteListDOM, this.satelliteList]];
        catalogColumns.map(([listDOM, list]) => {
            listDOM.innerHTML = '';
            let filteredList = list.sort(sortingFunction);
            filteredList.map(catalogEntry => {
                let newLI = new CatalogItem(catalogEntry, null);
                listDOM.append(newLI);
            });
        });
    }

    selectCategory(selection) {
        const firesListDOM = this.querySelector('#fires-column');
        firesListDOM.style.display = "none";
        const fuelMoistureListDOM = this.querySelector('#fuel-moisture-column');
        fuelMoistureListDOM.style.display = "none";
        const satelliteListDOM = this.querySelector('#satellite-column');
        satelliteListDOM.style.display = "none";
        if (selection == 'Fires') {
            firesListDOM.style.display = 'block';
        } else if (selection == 'Fuel Moisture') {
            fuelMoistureListDOM.style.display = 'block';
        } else {
            satelliteListDOM.style.display = 'block';
        }
    }

    /** Called when Component is removed from the DOM. Remove EventListners */
    disconnectedCallback() {
        this.querySelector('#menu-close').removeEventListener();
        this.querySelector('#menu-search').removeEventListener();
    }
}

window.customElements.define('catalog-menu', CatalogMenu);
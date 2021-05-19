import {dragElement} from '../../util.js';
import {getCatalogEntries} from '../../services.js';
import {CatalogItem} from './catalogItem.js';

/** A Component that builds the CatalogMenu. Can be added to html using <catalog-menu></catalog-menu> 
 * 
 * Includes three different columns for data related to fires, fuel moisture, and satellite data. 
 * Can be moved around by clicking the title bar, can be closed by clicking x in top right corner, and 
 * supports searching columns for data that matches a description. */
export class CatalogMenu extends HTMLElement {
    constructor() {
        super();
        // Arrays of catalog entries based on their descriptions.
        this.firesList = [];
        this.fuelMoistureList = [];
        this.satelliteList = [];
        this.addOrder = [];
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

    /** This function is called once the HTML Element has been added to the DOM. Add all the UI events and change some 
     * presentation details based on whether on mobile. */
    connectedCallback() {
        const catalogMenu = this.querySelector('.catalog-menu');
        const clientWidth = document.body.clientWidth;
        const sortBy = this.querySelector('#sort-by');
        const reverseOrder = this.querySelector('#reverse-order');
        const reverseLabel = this.querySelector('#reverse-label');
        const menuSearch = this.querySelector('#search-for');
        const menuSelect = this.querySelector('#mobile-selector');
        // change labels, sizes and positions based on screen size
        reverseLabel.innerText = (clientWidth < 769) ? "Reverse" : "Reverse Order";
        catalogMenu.style.right = ((clientWidth - catalogMenu.clientWidth)/ 2) + "px";
        var searchDescription = (clientWidth < 769) ? "Search..." : "Search for Simulation...";
        // Makes sure that map events like zooming and panning are disabled from within menu div
        L.DomEvent.disableClickPropagation(catalogMenu);
        // Closes the menu when the x is clicked
        this.querySelector('#menu-close').onclick = () => {
            catalogMenu.style.display = 'none';
        }
        // Implements repositioning menu
        dragElement(catalogMenu, "menu-title");
        menuSearch.placeholder = searchDescription;
        menuSearch.onpointerdown = (e) => {
            e.stopPropagation();
        }
        // Sets up search functionality
        menuSearch.oninput = () => {
            this.searchCatalog(menuSearch.value.toLowerCase(), sortBy.value);
        }
        sortBy.onchange = () => {
            this.sortBy(sortBy.value, reverseOrder.checked);
        }
        reverseOrder.onclick = () => {
            this.sortBy(sortBy.value, reverseOrder.checked);
        }
        menuSelect.onchange = () => {
            this.selectCategory(menuSelect.value);
        }
        this.buildMenu();
    }

    /** Function that retrieves catalog Entries from services.js and builds a CatalogItem for each and adds it to the 
     * appropriate category in the menu. */
    async buildMenu() {
        const urlParams = new URLSearchParams(window.location.search);
        const navJobId = urlParams.get('job_id');
        const firesListDOM = this.querySelector('#catalog-fires');
        const fuelMoistureListDOM = this.querySelector('#catalog-fuel-moisture');
        const satelliteListDOM = this.querySelector('#catalog-satellite-data');
        // build html for list item for each catalog entry and add it to the proper list depending on its description
        const catalogEntries = await getCatalogEntries();
        for (const [catName, catEntry] of Object.entries(catalogEntries)) {
            this.addOrder.push(catEntry.job_id);
            let desc = catEntry.description;
            var newLI = new CatalogItem(catEntry, navJobId);
            if(desc.indexOf('GACC') >= 0) {
                this.fuelMoistureList.push(catEntry);
                fuelMoistureListDOM.appendChild(newLI);
            } else if(desc.indexOf('SAT') >= 0) {
                this.satelliteList.push(catEntry);
                satelliteListDOM.appendChild(newLI);
            } else {
                this.firesList.push(catEntry);
                firesListDOM.appendChild(newLI);
            }
        }
    }

    /** Called each time a character is entered into the search input. filters the stored array of catalog entries by search text */
    searchCatalog(searchText, sortBy) {
        const filterFunction = (catalogEntry) => {
            if (sortBy == 'original-order' || sortBy == 'description') {
                return catalogEntry.description.toLowerCase().includes(searchText);
            }
            if (sortBy.includes('start-date')) {
                return catalogEntry.from_utc.toLowerCase().includes(searchText);
            }
            if (sortBy.includes('end-date')) {
                return catalogEntry.to_utc.toLowerCase().includes(searchText);
            }
        }
        const createList = (list) => list.filter(filterFunction);
        this.filterColumns(createList);
    }

    /** Function that sorts the lists in the menu. Takes @sortBy the selected category to sortBy and @reverseOrder indicating if 
     * the order should be reversed. */
    sortBy(sortBy, reverseOrder) {
        const catalogSearch = this.querySelector('#search-for');
        catalogSearch.value = "";
        const sortingFunction = (listElem1, listElem2) => {
            let result = false;
            if (sortBy == "original-order") result = this.addOrder.indexOf(listElem1.job_id) > this.addOrder.indexOf(listElem2.job_id);
            if (sortBy == "description") result = listElem1.description > listElem2.description; 
            if (sortBy == "start-date") result = listElem1.from_utc > listElem2.from_utc;
            if (sortBy == "end-date") result = listElem1.to_utc > listElem2.to_utc;
            if (reverseOrder) result = !result;
            return result ? 1 : -1;
        }
        const createList = (list) => list.sort(sortingFunction);
        this.filterColumns(createList);
    }

    /** Clears each catalog column on the DOM, filters the stored array of catalog entries by 
     * provided function. Builds <li> html for filtered catalog entries and adds them to the columns */
    filterColumns(createList) {
        const firesListDOM = this.querySelector('#catalog-fires');
        const fuelMoistureListDOM = this.querySelector('#catalog-fuel-moisture');
        const satelliteListDOM = this.querySelector('#catalog-satellite-data');
        let catalogColumns = [[firesListDOM, this.firesList], [fuelMoistureListDOM, this.fuelMoistureList], [satelliteListDOM, this.satelliteList]];
        for (const [listDOM, list] of catalogColumns) {
            listDOM.innerHTML = '';
            let newList = createList(list);
            for (var catalogEntry of newList) {
                let newLI = new CatalogItem(catalogEntry, null);
                listDOM.append(newLI);
            }
        }
    }

    /** Function used only in mobile versions. Mobile shows only one column at a time and this function is called when a user switches between columns. 
     * Hides all columns and then shows the selected column. */
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
}

window.customElements.define('catalog-menu', CatalogMenu);
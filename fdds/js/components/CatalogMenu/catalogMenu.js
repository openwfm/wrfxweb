import { dragElement, utcToLocal } from '../../util.js';
import { getCatalogEntries } from '../../services.js';
import { CatalogItem } from './catalogItem.js';
import { controllerEvents, controllers } from '../Controller.js';

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
            <div>
                <div id='catalog-button' class='feature-controller catalog-button'>
                    <div id='catalog-menu-icon-container'>
                        <svg id='catalog-menu-icon' class='interactive-button svgIcon'>
                            <use href='#menu-24px'></use>
                        </svg>
                    </div>
                    <div id='menu-label'>Catalog</div>
                </div>
                <div class='catalog-menu round-border'>
                    <div id='menu-title' class='menu-title round-border'>
                        <div>Select Simulation...</div>
                        <div id='menu-close' class='round-border'>x</div>
                    </div>
                    <div class='search-header'>
                        <div>
                            <label for='sort-by' style='display: block; font-size:.75rem'>order/search by</label>
                            <select id='sort-by'>
                                <option value='original-order'>original order</option>
                                <option value='description'>description</option>
                                <option value='start-date'>start date</option>
                                <option value='end-date'>end date</option>
                            </select>
                        </div>
                        <div class='sorting-column'>
                            <label id='reverse-label' for='reverse-order'>Reverse Order</label>
                            <input type='checkbox' id='reverse-order'></input>
                        </div>
                        <input id='search-for' type='text'></input>
                    </div>
                    <div class='menu-columns'>
                        <select id='mobile-selector'>
                            <option value='Fires'>Fires</option>
                            <option value='Fuel Moisture'>Fuel Moisture</option>
                            <option value='Satellite Data'>Satellite Data</option>
                        </select>
                        <div id='fires-column' class='column'>
                            <div class='column-header'>Fires</div>
                            <ul id='catalog-fires' class='catalog-list'> </ul>
                        </div>
                        <div id='fuel-moisture-column' class='column'>
                            <div class='column-header'>Fuel moisture</div>
                            <ul id='catalog-fuel-moisture' class='catalog-list'> </ul>
                        </div>
                        <div id='satellite-column' class='column'>
                            <div class='column-header'>Satellite Data</div>
                            <ul id='catalog-satellite-data' class='catalog-list'> </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /** This function is called once the HTML Element has been added to the DOM. Add all the UI events and change some 
     * presentation details based on whether on mobile. */
    connectedCallback() {
        const catalogMenu = this.querySelector('.catalog-menu');
        L.DomEvent.disableClickPropagation(catalogMenu);

        dragElement(catalogMenu, 'menu-title');
        this.hideShowMenu();
        this.responsiveUI();
        window.addEventListener('resize', () => { 
            this.responsiveUI();
        });
        this.setMenuSearching();
        this.buildMenu();
        controllers.addSimulation.subscribe(() => {
            catalogMenu.classList.remove('hidden');
        }, controllerEvents.setTrue);
    }

    setMenuSearching() {
        const sortBy = this.querySelector('#sort-by');
        const reverseOrder = this.querySelector('#reverse-order');
        const menuSearch = this.querySelector('#search-for');
        const menuSelect = this.querySelector('#mobile-selector');

        menuSearch.onpointerdown = (e) => {
            e.stopPropagation();
        }
        menuSearch.oninput = () => {
            this.searchCatalog(menuSearch.value.toLowerCase(), sortBy.value, reverseOrder.checked);
        }
        sortBy.onchange = () => {
            this.sortBy(sortBy.value, reverseOrder.checked);
        }
        reverseOrder.onclick = () => {
            this.searchCatalog(menuSearch.value.toLowerCase(), sortBy.value, reverseOrder.checked);
        }
        menuSelect.onchange = () => {
            this.selectCategory(menuSelect.value);
        }
    }

    responsiveUI() {
        const clientWidth = document.body.clientWidth;

        const catalogMenu = this.querySelector('.catalog-menu');
        const reverseLabel = this.querySelector('#reverse-label');
        const menuSearch = this.querySelector('#search-for');

        reverseLabel.innerText = (clientWidth < 769) ? 'Reverse' : 'Reverse Order';
        catalogMenu.style.right = ((clientWidth - catalogMenu.clientWidth)/ 2) + 'px';
        var searchDescription = (clientWidth < 769) ? 'Search...' : 'Search for Simulation...';
        menuSearch.placeholder = searchDescription;
        if (clientWidth < 769) {
            this.selectCategory('Fires');
        } else {
            const firesListDOM = this.querySelector('#fires-column');
            const fuelMoistureListDOM = this.querySelector('#fuel-moisture-column');
            const satelliteListDOM = this.querySelector('#satellite-column');
            firesListDOM.classList.remove('hidden');
            fuelMoistureListDOM.classList.remove('hidden');
            satelliteListDOM.classList.remove('hidden');
        }
        
    }

    hideShowMenu() {
        const catalogMenu = this.querySelector('.catalog-menu');
        const catalogButton = this.querySelector('#catalog-button');
        L.DomEvent.disableClickPropagation(catalogButton);
        catalogButton.onpointerdown = () => {
            if (catalogMenu.classList.contains('hidden')) {
                catalogMenu.classList.remove('hidden');
            } else {
                catalogMenu.classList.add('hidden');
                if (controllers.addSimulation.getValue()) {
                    controllers.addSimulation.setValue(false, controllerEvents.setFalse);
                }
            }
        };
        this.querySelector('#menu-close').onclick = () => {
            catalogMenu.classList.add('hidden');
            if (controllers.addSimulation.getValue()) {
                controllers.addSimulation.setValue(false, controllerEvents.setFalse);
            }
        }
    }

    /** Function that retrieves catalog Entries from services.js and builds a CatalogItem for each and adds it to the 
     * appropriate category in the menu. */
    async buildMenu() {
        const urlParams = new URLSearchParams(window.location.search);
        const navJobId = urlParams.get('job_id');
        const firesListDOM = this.querySelector('#catalog-fires');
        const fuelMoistureListDOM = this.querySelector('#catalog-fuel-moisture');
        const satelliteListDOM = this.querySelector('#catalog-satellite-data');
        const catalogEntries = await getCatalogEntries();
        for (const [catName, catEntry] of Object.entries(catalogEntries)) {
            this.addOrder.push(catEntry.job_id);
            let desc = catEntry.description;
            var newLI = new CatalogItem(catEntry, navJobId);
            if(desc.indexOf('GACC') >= 0 || desc.indexOf(' FM') >= 0) {
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
        this.sortBy('original-order', false);
        this.clickMostRecent(navJobId);
    }

    clickMostRecent(navJobId) {
        const firesListDOM = this.querySelector('#catalog-fires');
        if (!navJobId || !navJobId.includes('recent')) {
            return;
        }
        var descSearchTerm = navJobId.split('-')[0];
        var mostRecentItem = null;
        for (var fire of firesListDOM.childNodes) {
            var fireDesc = fire.catEntry.description;
            if (fireDesc.toLowerCase().includes(descSearchTerm)) {
                if (!mostRecentItem || (fire.catEntry.from_utc > mostRecentItem.catEntry.from_utc)) {
                    mostRecentItem = fire;
                }
            }
        }
        if (mostRecentItem != null) {
            mostRecentItem.handle_catalog_click();
        }
    }

    /** Called each time a character is entered into the search input. filters the stored array of catalog entries by search text */
    searchCatalog(searchText, sortBy, reverseOrder) {
        const filterFunction = (catalogEntry) => {
            if (sortBy == 'original-order' || sortBy == 'description') {
                return catalogEntry.description.toLowerCase().includes(searchText);
            }
            if (sortBy.includes('start-date')) {
                return utcToLocal(catalogEntry.from_utc).toLowerCase().includes(searchText);
            }
            if (sortBy.includes('end-date')) {
                return utcToLocal(catalogEntry.to_utc).toLowerCase().includes(searchText);
            }
        }
        const createList = (list) => {
            var filteredList = list.filter(filterFunction);
            if (reverseOrder) {
                filteredList.reverse();
            }
            return filteredList;
        }
        this.filterColumns(createList);
    }

    /** Function that sorts the lists in the menu. Takes @sortBy the selected category to sortBy and @reverseOrder indicating if 
     * the order should be reversed. */
    sortBy(sortBy, reverseOrder) {
        const catalogSearch = this.querySelector('#search-for');
        catalogSearch.value = '';
        const sortingFunction = (listElem1, listElem2) => {
            let result = false;
            if (sortBy == 'original-order') {
                var desc = listElem1.description;
                if (desc.indexOf('GACC') >= 0 || desc.indexOf(' FM') >= 0) {
                    result = listElem1.description.toLowerCase() > listElem2.description.toLowerCase(); 
                } else {
                    result = this.addOrder.indexOf(listElem1.job_id) > this.addOrder.indexOf(listElem2.job_id);
                }
            }
            if (sortBy == 'description') {
                result = listElem1.description.toLowerCase() > listElem2.description.toLowerCase(); 
            }
            if (sortBy == 'start-date') {
                if (listElem1.from_utc == listElem2.from_utc) {
                    result = listElem1.description.toLowerCase() > listElem2.description.toLowerCase(); 
                } else {
                    result = listElem1.from_utc > listElem2.from_utc;
                }
            }
            if (sortBy == 'end-date') {
                if (listElem1.to_utc == listElem2.to_utc) {
                    result = listElem1.description.toLowerCase() > listElem2.description.toLowerCase(); 
                } else {
                    result = listElem1.to_utc > listElem2.to_utc;
                }
            }
            if (reverseOrder) {
                result = !result;
            }
            return result ? 1 : -1;
        }
        const createList = (list) => { 
            return list.sort(sortingFunction);
        }
        this.filterColumns(createList);
    }

    /** Clears each catalog column on the DOM, filters the stored array of catalog entries by 
     * provided function. Builds <li> html for filtered catalog entries and adds them to the columns */
    filterColumns(listCreator) {
        const firesListDOM = this.querySelector('#catalog-fires');
        const fuelMoistureListDOM = this.querySelector('#catalog-fuel-moisture');
        const satelliteListDOM = this.querySelector('#catalog-satellite-data');
        let catalogColumns = [[firesListDOM, this.firesList], [fuelMoistureListDOM, this.fuelMoistureList], [satelliteListDOM, this.satelliteList]];
        for (var [listDOM, list] of catalogColumns) {
            listDOM.innerHTML = '';
            var newList = listCreator(list);
            for (var catalogEntry of newList) {
                var newLI = new CatalogItem(catalogEntry, null);
                listDOM.append(newLI);
            }
        }
    }

    /** Function used only in mobile versions. Mobile shows only one column at a time and this function is called when a user switches between columns. 
     * Hides all columns and then shows the selected column. */
    selectCategory(selection) {
        const firesListDOM = this.querySelector('#fires-column');
        const fuelMoistureListDOM = this.querySelector('#fuel-moisture-column');
        const satelliteListDOM = this.querySelector('#satellite-column');
        firesListDOM.classList.add('hidden');
        fuelMoistureListDOM.classList.add('hidden');
        satelliteListDOM.classList.add('hidden');
        if (selection == 'Fires') {
            firesListDOM.classList.remove('hidden');
        } else if (selection == 'Fuel Moisture') {
            fuelMoistureListDOM.classList.remove('hidden');
        } else {
            satelliteListDOM.classList.remove('hidden');
        }
    }
}

window.customElements.define('catalog-menu', CatalogMenu);
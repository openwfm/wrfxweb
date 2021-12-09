import { catalogEntries } from '../../app.js';
import { simState } from '../../state/simState.js';
import { CatalogMenuUI } from './CatalogMenuUI/catalogMenuUI.js';
import { CatalogItem } from './catalogItem.js';

/** Component for menu. Includes three different columns for data related to fires, fuel moisture, and satellite data. 
 * Can be moved around by clicking the title bar, can be closed by clicking x in top right corner, and 
 * supports searching columns for data that matches a description.
 */
export class CatalogMenu extends CatalogMenuUI {
    constructor() {
        super();
        this.firesList = [];
        this.fuelMoistureList = [];
        this.satelliteList = [];
        this.addOrder = [];
    }

    connectedCallback() {
        super.connectedCallback();
        this.initializeMenuSearching();
        this.createMenuEntries();
    }

    createMenuEntries() {
        let { simId } = simState.presetParameters;
        let { firesListDOM, fuelMoistureListDOM, satelliteListDOM } = this.uiElements;
        for (let catName in catalogEntries) {
            let catEntry = catalogEntries[catName];
            this.addOrder.push(catEntry.job_id);
            let desc = catEntry.description;
            let newLI = new CatalogItem(catEntry, simId);
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
        this.sortMenu('original-order', false);
        this.clickMostRecent(simId);
    }

    clickMostRecent(navJobId) {
        let { firesListDOM } = this.uiElements;
        if (!navJobId || !navJobId.includes('recent')) {
            return;
        }
        let descSearchTerm = navJobId.split('-')[0].toLowerCase();
        let mostRecentItem = null;
        let secondMostRecentItem = null;
        for (let fire of firesListDOM.childNodes) {
            let fireDesc = fire.catEntry.description;
            if (fireDesc.toLowerCase().includes(descSearchTerm)) {
                if (!mostRecentItem || (fire.catEntry.from_utc > mostRecentItem.catEntry.from_utc)) {
                    secondMostRecentItem = mostRecentItem;
                    mostRecentItem = fire;
                } else if (!secondMostRecentItem || (fire.catEntry.from_utc > secondMostRecentItem.catEntry.from_utc)) {
                    secondMostRecentItem = fire;
                }
            }
        }
        let itemToNavigateTo = mostRecentItem;
        if (navJobId.includes('second-recent')) {
            itemToNavigateTo = secondMostRecentItem;
        }
        
        if (itemToNavigateTo != null) {
            itemToNavigateTo.clickItem();
        }
    }

    initializeMenuSearching() {
        let { menuSearch, menuSelect, reverseOrder, sortBy } = this.uiElements;

        menuSearch.onpointerdown = (e) => {
            e.stopPropagation();
        }
        menuSearch.oninput = () => {
            this.searchCatalog(menuSearch.value.toLowerCase(), sortBy.value, reverseOrder.checked);
        }
        sortBy.onchange = () => {
            this.sortMenu(sortBy.value, reverseOrder.checked);
        }
        reverseOrder.onclick = () => {
            this.searchCatalog(menuSearch.value.toLowerCase(), sortBy.value, reverseOrder.checked);
        }
        menuSelect.onchange = () => {
            this.selectCategory(menuSelect.value);
        }
    }

    /** ===== Searching block ===== */
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
            let filteredList = list.filter(filterFunction);
            if (reverseOrder) {
                filteredList.reverse();
            }
            return filteredList;
        }
        this.filterColumns(createList);
    }

    sortMenu(sortBy, reverseOrder) {
        let { menuSearch } = this.uiElements;
        menuSearch.value = '';
        const sortingFunction = (listElem1, listElem2) => {
            let result;
            switch(sortBy) {
                case 'original-order':
                    result = this.sortByOriginalOrder(listElem1, listElem2);
                    break;
                case 'description':
                    result = this.sortByDescription(listElem1, listElem2);
                    break;
                case 'start-date':
                    result = this.sortByStartDate(listElem1, listElem2);
                    break;
                case 'end-date':
                    result = this.sortByEndDate(listElem1, listElem2);
                    break;
                default: 
                    result = false;
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

    sortByOriginalOrder(listElem1, listElem2) {
        let desc = listElem1.description;
        if (desc.indexOf('GACC') >= 0 || desc.indexOf(' FM') >= 0) {
            return listElem1.description.toLowerCase() > listElem2.description.toLowerCase(); 
        } else {
            return this.addOrder.indexOf(listElem1.job_id) > this.addOrder.indexOf(listElem2.job_id);
        }
    }

    sortByDescription(listElem1, listElem2) {
        return listElem1.description.toLowerCase() > listElem2.description.toLowerCase(); 
    }

    sortByStartDate(listElem1, listElem2) {
        if (listElem1.from_utc == listElem2.from_utc) {
            return listElem1.description.toLowerCase() > listElem2.description.toLowerCase(); 
        } else {
            return listElem1.from_utc > listElem2.from_utc;
        }
    }

    sortByEndDate(listElem1, listElem2) {
        if (listElem1.to_utc == listElem2.to_utc) {
            return listElem1.description.toLowerCase() > listElem2.description.toLowerCase(); 
        } else {
            return listElem1.to_utc > listElem2.to_utc;
        }
    }

    filterColumns(listCreator) {
        let { firesListDOM, fuelMoistureListDOM, satelliteListDOM } = this.uiElements;

        this.filterColumn(firesListDOM, this.firesList, listCreator);
        this.filterColumn(fuelMoistureListDOM, this.fuelMoistureList, listCreator);
        this.filterColumn(satelliteListDOM, this.satelliteList, listCreator);
    }

    filterColumn(categoryDOM, categoryList, listCreator) {
        categoryDOM.innerHTML = '';
        let newList = listCreator(categoryList);
        for (let catalogEntry of newList) {
            let newLI = new CatalogItem(catalogEntry, null);
            categoryDOM.append(newLI);
        }
    }
}

window.customElements.define('catalog-menu', CatalogMenu);
import { catalogMenuHTML } from './catalogMenuHTML.js';
import { dragElement } from '../../../util.js';
import { SimComponentModel } from '../../../models/simComponentModel.js';
import { CLIENT_WIDTH, ISMOBILE } from '../../../app.js';

/** Component for menu. Includes three different columns for data related to fires, fuel moisture, and satellite data. 
 * Can be moved around by clicking the title bar, can be closed by clicking x in top right corner, and 
 * supports searching columns for data that matches a description.
 * 
 *                  Contents
 *  1. Initialization block
 *  2. Searching block
 * 
 */
export class CatalogMenuUI extends SimComponentModel {
    /** ===== Initialization block ===== */
    constructor() {
        super();
        this.innerHTML = catalogMenuHTML;
        this.uiElements = {
            catalogMenu: this.querySelector('.catalog-menu'),
            catalogButton: this.querySelector('#catalog-button'),
            menuClose: this.querySelector('#menu-close'),
            reverseLabel: this.querySelector('#reverse-label'),
            reverseOrder: this.querySelector('#reverse-order'),
            menuSearch: this.querySelector('#search-for'),
            sortBy: this.querySelector('#sort-by'),
            menuSelect: this.querySelector('#mobile-selector'),
            firesListDOM: this.querySelector('#fires-column'),
            fuelMoistureListDOM: this.querySelector('#fuel-moisture-column'),
            satelliteListDOM: this.querySelector('#satellite-column'),
        }
    }

    connectedCallback() {
        const catalogMenu = this.querySelector('.catalog-menu');
        L.DomEvent.disableClickPropagation(catalogMenu);

        dragElement(catalogMenu, 'menu-title');
        this.hideShowMenu();
        this.windowResize();
    }

    windowResize() {
        let { catalogMenu, reverseLabel, menuSearch, firesListDOM, fuelMoistureListDOM, satelliteListDOM } = this.uiElements;

        reverseLabel.innerText = ISMOBILE ? 'Reverse' : 'Reverse Order';
        catalogMenu.style.right = ((CLIENT_WIDTH - catalogMenu.clientWidth)/ 2) + 'px';
        let searchDescription = ISMOBILE ? 'Search...' : 'Search for Simulation...';
        menuSearch.placeholder = searchDescription;
        if (ISMOBILE) {
            this.selectCategory('Fires');
        } else {
            firesListDOM.classList.remove('hidden');
            fuelMoistureListDOM.classList.remove('hidden');
            satelliteListDOM.classList.remove('hidden');
        }
    }

    changeSimulation() {
        let { catalogMenu } = this.uiElements;
        catalogMenu.classList.add('hidden');
    }

    hideShowMenu() {
        let { catalogMenu, catalogButton, menuClose } = this.uiElements;
        L.DomEvent.disableClickPropagation(catalogButton);
        catalogButton.onpointerdown = () => {
            if (catalogMenu.classList.contains('hidden')) {
                catalogMenu.classList.remove('hidden');
            } else {
                catalogMenu.classList.add('hidden');
            }
        };
        menuClose.onclick = () => {
            catalogMenu.classList.add('hidden');
        }
    }

    /** Function used only in mobile versions. Mobile shows only one column at a time and this function is called when a user switches between columns. 
     * Hides all columns and then shows the selected column. */
    selectCategory(selection) {
        let { firesListDOM, fuelMoistureListDOM, satelliteListDOM } = this.uiElements;
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
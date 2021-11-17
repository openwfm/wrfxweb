import { dragElement } from '../../util.js';
import { SimComponentModel } from '../../models/simComponentModel.js';
import { CLIENT_WIDTH, ISMOBILE } from '../../app.js';

/** Component for menu. Includes three different columns for data related to fires, fuel moisture, and satellite data. 
 * Can be moved around by clicking the title bar, can be closed by clicking x in top right corner, and 
 * supports searching columns for data that matches a description.
 * 
 *                  Contents
 *  1. Initialization block
 *  2. Searching block
 * 
 */
export class CatalogMenu extends SimComponentModel {
    /** ===== Initialization block ===== */
    constructor() {
        super();
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

    connectedCallback() {
        const catalogMenu = this.querySelector('.catalog-menu');
        L.DomEvent.disableClickPropagation(catalogMenu);

        dragElement(catalogMenu, 'menu-title');
        this.hideShowMenu();
        this.windowResize();
    }

    changeSimulation() {
        const catalogMenu = this.querySelector('.catalog-menu');
        catalogMenu.classList.add('hidden');
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
            }
        };
        this.querySelector('#menu-close').onclick = () => {
            catalogMenu.classList.add('hidden');
        }
    }

    windowResize() {
        const catalogMenu = this.querySelector('.catalog-menu');
        const reverseLabel = this.querySelector('#reverse-label');
        const menuSearch = this.querySelector('#search-for');

        reverseLabel.innerText = ISMOBILE ? 'Reverse' : 'Reverse Order';
        catalogMenu.style.right = ((CLIENT_WIDTH - catalogMenu.clientWidth)/ 2) + 'px';
        let searchDescription = ISMOBILE ? 'Search...' : 'Search for Simulation...';
        menuSearch.placeholder = searchDescription;
        if (ISMOBILE) {
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
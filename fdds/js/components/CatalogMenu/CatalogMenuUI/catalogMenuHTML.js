export const catalogMenuHTML = `
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
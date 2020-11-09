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

        // needed for proper function scoping
        var parentComponent = this;
        // fetch catalog
        $.getJSON("simulations/catalog.json", function(data) {
            catalog = data;
            const firesListDOM = parentComponent.querySelector('#catalog-fires');
            const fuelMoistureListDOM = parentComponent.querySelector('#catalog-fuel-moisture');
            const satelliteListDOM = parentComponent.querySelector('#catalog-satellite-data');
            // build html for list item for each catalog entry and add it to the proper list depending on its description
            $.each(data, function(cat_name) {
                var cat_entry = data[cat_name];
                let desc = cat_entry.description;
                var newLI = parentComponent.buildListItem(cat_entry);
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
            });
        });
    }

    /** Returns <li> html element from a given catalog entry */
    buildListItem(cat_entry) {
        var newLI = document.createElement('li');
        var job_id = cat_entry.job_id;
        var kml_url = cat_entry.kml_url;
        var zip_url = cat_entry.zip_url;
        var innerHTML = '<b>' + cat_entry.description + '</b><br/>'
                        + 'from: ' + cat_entry.from_utc + '<br/>'
                        + 'to: ' + cat_entry.to_utc + '<br/>';
        if(job_id) {
            innerHTML += 'job id: ' + job_id + '<br/>';
        }
        newLI.onclick = () => this.handle_catalog_click(job_id, 'simulations/' + cat_entry.manifest_path);
        newLI.className = 'catalog-entry';
        if(kml_url) {
            let mb = Math.round(10*cat_entry.kml_size/1048576.0)/10;
            innerHTML += '<a href="' + kml_url + '" download>Download KMZ ' + mb.toString() +' MB</a><br/>' ;
        }
        if(zip_url) {
            let mb = Math.round(10*cat_entry.zip_size/1048576.0)/10;
            innerHTML += '<a href="' + zip_url + '" download>Download ZIP ' + mb.toString() +' MB</a><br/>' ;
        }
        newLI.innerHTML = innerHTML;
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

    /** Makes given element draggable */
    dragElement(elmnt) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        document.getElementById(elmnt.id + "menu-title").onmousedown = dragMouseDown;
      
        function dragMouseDown(e) {
          e = e || window.event;
          e.preventDefault();
          // get the mouse cursor position at startup:
          pos3 = e.clientX;
          pos4 = e.clientY;
          document.onmouseup = closeDragElement;
          // call a function whenever the cursor moves:
          document.onmousemove = elementDrag;
        }
      
        function elementDrag(e) {
          e = e || window.event;
          e.preventDefault();
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
          document.onmouseup = null;
          document.onmousemove = null;
        }
    }

    handle_catalog_click(entryID, path) {
        // close selection dialog

        this.querySelector('.catalog-menu').style.display = "none";
        console.log(entryID);
        // history.pushState(id: entryID}, 'Data', entryID)

        // show job description
        var catPath = path.substring(0,path.lastIndexOf("/") + 1) + "catalog.json";
        
        //REVERT THIS BEFORE COMMITTING
        $.getJSON(catPath.replaceAll(":", "_"), function(data) {
            // $.getJSON(catPath, function(data) {
            catalog = data;
            $.each(data, function(cat_name) {
                var cat_entry = data[cat_name];
                var desc = cat_entry.description + ' Experimental forecast ONLY';
                $("#displayTest").show();
                $("#displayTest2").show();
                $("#displayTest").html(desc);
            });
            });

        // REVERT THIS
        $.getJSON(path.replaceAll(":", "_"), function(selected_simulation) {
        // $.getJSON(path, function(selected_simulation) {
            // store in global state
            rasters = selected_simulation;
            // REVERT THIS
            raster_base = "https://demo.openwfm.org/ch/" + path.substring(0, path.lastIndexOf('/') + 1);
            // raster_base = path.substring(0, path.lastIndexOf('/') + 1);  

            // retrieve all domains
            domains = Object.keys(rasters);
            current_domain = domains[0];

            // update the domain radio buttons
            $('#domain-checkboxes').empty();
            $('#domain-checkboxes').append('<div class="ui large label">Active domain</div><br/>');
            for(var dom in domains) {
            var dom_id = domains[dom];
            var checked = '';
            if(dom_id == '1') { checked = ' checked="yes"'}
            $('#domain-checkboxes').append('<div class="field"><div class="ui radio checkbox"><input type="radio" name="domains" id="' + dom_id + '"' + checked + ' onclick="setup_for_domain(\''+dom_id+'\');"/><label for="' + dom_id + '">' + dom_id + '</label></div></div>');
            }
            $('#domain-selector').show();

            setup_for_domain(current_domain);
        });
    }

    /** Called when Component is removed from the DOM. Remove EventListners */
    disconnectedCallback() {
        this.querySelector('#menu-close').removeEventListener();
        this.querySelector('#menu-search').removeEventListener();
    }
}

window.customElements.define('catalog-menu', CatalogMenu);
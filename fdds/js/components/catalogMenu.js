/**
 * A Component that builds the CatalogMenu. 
 */
class CatalogMenu extends HTMLElement {
    constructor() {
        super();
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
                <div class="menu-columns" id="default-menu">
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
        L.DomEvent.disableScrollPropagation(catalogMenu);
        L.DomEvent.disableClickPropagation(catalogMenu);
        this.querySelector('#menu-close').addEventListener('click', () => {
            catalogMenu.style.display = 'none';
        });
        this.dragElement(catalogMenu);

        const menuSearch = this.querySelector('#menu-search');
        menuSearch.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        menuSearch.oninput = (input) => this.searchCatalog(input);

        var parentComponent = this;
        $.getJSON("simulations/catalog.json", function(data) {
            catalog = data;
            const firesListDOM = $('#catalog-fires');
            const fuelMoistureListDOM = $('#catalog-fuel-moisture');
            const satelliteListDOM = $('#catalog-satellite-data');
            $.each(data, function(cat_name) {
                var cat_entry = data[cat_name];
                let desc = cat_entry.description;
                var html = parentComponent.buildListItem(cat_entry);
                if(desc.indexOf('GACC') >= 0) {
                    parentComponent.fuelMoistureList.push(cat_entry);
                    fuelMoistureListDOM.append(html);
                } else if(desc.indexOf('SAT') >= 0) {
                    parentComponent.satelliteList.push(cat_entry);
                    satelliteListDOM.append(html);
                } else {
                    parentComponent.firesList.push(cat_entry);
                    firesListDOM.append(html);
                }
            });
        });
    }

    buildListItem(cat_entry) {
        var job_id = cat_entry.job_id;
        var kml_url = cat_entry.kml_url;
        var zip_url = cat_entry.zip_url;
        var load_cmd = '"handle_catalog_click(\'simulations/' + cat_entry.manifest_path + '\');"';
        var html = '<li class="catalog-entry" onclick=' + load_cmd + '><b>' 
                    + cat_entry.description + '</b><br/>' 
                                            + 'from: ' + cat_entry.from_utc + '<br/>to: ' + cat_entry.to_utc  + '<br/>';
        if(job_id) {
            html = html  + 'job id: ' + job_id + '<br/>';
        }
        html = html + '</li>';
        if(kml_url) {
            let mb = Math.round(10*cat_entry.kml_size/1048576.0)/10;
            html = html + '<a href="' + kml_url + '" download>Download KMZ ' + mb.toString() +' MB</a><br/>' ;
        }
        if(zip_url) {
            let mb = Math.round(10*cat_entry.zip_size/1048576.0)/10;
            html = html + '<a href="' + zip_url + '" download>Download ZIP ' + mb.toString() +' MB</a><br/>' ;
        }
        return html;
    }

    searchCatalog(input) {
        console.log(input);
    }

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

    disconnectedCallback() {
        this.querySelector('#menu-close').removeEventListener();
    }
}

window.customElements.define('catalog-menu', CatalogMenu);
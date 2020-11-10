const template = document.createElement('template');
template.innerHTML = `
    <style>
        li.catalog-entry {
            list-style-type: none;
            padding: 0px;
        }

        li.catalog-entry:hover {
            background-color: #fdfd96;
        }
        h3 { 
            padding: 0px;
            margin: 0px;
            font-size: 1rem;
        }
        p {
            margin: 0px;
        }
        a {
            color: black;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
    <li class='catalog-entry'>
        <div id='entry'>
            <h3></h3>
            <p id='from'>from:  </p>
            <p id='to'>to: </p>
            <p id='jobID'>job id:  </p>
        </div>
        <div id='links'>
            <a id='kml' download></a>
            <a id='zip' download></a>
        </div>
    </li>
`;
class CatalogItem extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode :'open'});
    }

    connectedCallback() {
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        let description = this.getAttribute("description");
        let jobId = this.getAttribute('jobId');
        let to = this.getAttribute('to');
        let from = this.getAttribute('from');
        let kmlURL = this.getAttribute('kmlURL');
        let kmlSize = this.getAttribute('kmlSize');
        let zipURL = this.getAttribute('zipURL');
        let zipSize = this.getAttribute('zipSize');
        let manifestPath = this.getAttribute("manifestPath");

        this.shadowRoot.querySelector('h3').innerText = description;
        this.shadowRoot.querySelector('#jobID').innerText += ' ' + jobId;
        this.shadowRoot.querySelector('#from').innerText += ' ' + from;
        this.shadowRoot.querySelector('#to').innerText += ' ' + to;
        if(kmlURL) {
            let mb = Math.round(10*kmlSize/1048576.0)/10;
            const kmlLink = this.shadowRoot.querySelector('#kml');
            kmlLink.href = kmlURL;
            kmlLink.innerText = 'Download KMZ ' + mb.toString() + ' MB';
        }
        if(zipURL) {
            let mb = Math.round(10*zipSize/1048576.0)/10;
            const zipLink = this.shadowRoot.querySelector('#zip');
            zipLink.href = zipURL;
            zipLink.innerText = 'Download ZIP ' + mb.toString() + ' MB';
        }

        this.shadowRoot.querySelector('#entry').onclick = () => this.handle_catalog_click(jobId, 'simulations/' + manifestPath);
    }

    /** Called when an item of the catalog is clicked. Closes the menu, fetches data associated
     * with a run, 
     */
    handle_catalog_click(entryID, path) {
        // close selection dialog

        document.querySelector('.catalog-menu').style.display = "none";
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
            // const domainCheckboxes = document.querySelector('#domain-checkboxes');

            // update the domain radio buttons
            $('#domain-checkboxes').empty();
            $('#domain-checkboxes').append('<div class="ui large label">Active domain</div><br/>');
            for(var dom in domains) {
                var dom_id = domains[dom];
                var checked = dom_id == '1' ? 'checked=yes' : '';
                $('#domain-checkboxes').append('<div class="field"><div class="ui radio checkbox"><input type="radio" name="domains" id="' + dom_id + '"' + checked + ' onclick="setup_for_domain(\''+dom_id+'\');"/><label for="' + dom_id + '">' + dom_id + '</label></div></div>');
            }
            $('#domain-selector').show();

            setup_for_domain(current_domain);
        });
    }
}

window.customElements.define('catalog-item', CatalogItem);
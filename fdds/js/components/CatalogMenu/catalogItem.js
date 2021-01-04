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
/** Creates an Element for each Item of the CatalogMenu. Necessary for each element to have
 * its own component because of how much information is stored within each and how much has to
 * happen after one is clicked. 
 */
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
        let manifestPath = this.getAttribute('manifestPath');

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

        this.shadowRoot.querySelector('#entry').onclick = () => this.handle_catalog_click(jobId, 'simulations/' + manifestPath, description);
        if (this.getAttribute('navJobId') == jobId) this.handle_catalog_click(jobId, 'simulations/' + manifestPath, description);
    }

    /** Called when an item of the catalog is clicked. Closes the menu, fetches data associated
     * with a run, 
     */
    handle_catalog_click(entryID, path, description) {
        // close selection dialog
        currentSimulation = description;
        document.querySelector('#current-sim-label').innerText = 'Shown simulation: ' + description;
        document.querySelector('.catalog-menu').style.display = "none";
        history.pushState({id: entryID}, 'Data', "?job_id=" + entryID);

        document.querySelector('#simulation-flags').style.display = 'block';
        simulationService.getSimulation(path);

    }
}

window.customElements.define('catalog-item', CatalogItem);
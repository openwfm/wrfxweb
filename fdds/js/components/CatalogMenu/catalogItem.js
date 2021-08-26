import { getSimulation } from '../../services.js';
import { utcToLocal } from '../../util.js';
import { simVars } from '../../simVars.js';
import { controllerEvents, controllers } from '../Controller.js';

/** Creates an Element for each Item of the CatalogMenu. Necessary for each element to have
 * its own component because of how much information is stored within each and how much has to
 * happen after one is clicked. 
 */
export class CatalogItem extends HTMLElement {
    constructor(catEntry, navJobId) {
        super();
        this.innerHTML = `
            <li class='catalog-entry'>
                <div id='entry'>
                    <h3></h3>
                    <div id='from'>from:  </div>
                    <div id='to'>to: </div>
                    <div id='jobID'>job id:  </div>
                </div>
                <div id='links'>
                    <a id='kml' download></a>
                    <a id='zip' download></a>
                </div>
            </li>
        `;
        this.catEntry = catEntry;
        this.navJobId = navJobId;
    }

    connectedCallback() {
        let description = this.catEntry.description;
        let jobId = this.catEntry.job_id;
        let to = this.catEntry.to_utc;
        let from = this.catEntry.from_utc;
        let kmlURL = this.catEntry.kml_url;
        let kmlSize = this.catEntry.kml_size;
        let zipURL = this.catEntry.zip_url;
        let zipSize = this.catEntry.zip_size;
        let manifestPath = this.catEntry.manifest_path;

        this.querySelector('h3').innerText = description;
        this.querySelector('#jobID').innerText += ' ' + jobId;
        this.querySelector('#from').innerText += ' ' + utcToLocal(from);
        this.querySelector('#to').innerText += ' ' + utcToLocal(to);
        if(kmlURL) {
            let mb = Math.round(10*kmlSize/1048576.0)/10;
            const kmlLink = this.querySelector('#kml');
            kmlLink.href = kmlURL;
            kmlLink.innerText = 'Download KMZ ' + mb.toString() + ' MB';
        }
        if(zipURL) {
            let mb = Math.round(10*zipSize/1048576.0)/10;
            const zipLink = this.querySelector('#zip');
            zipLink.href = zipURL;
            zipLink.innerText = 'Download ZIP ' + mb.toString() + ' MB';
        }

        this.querySelector('#entry').onclick = () => {
            this.handle_catalog_click();
        }
        if (this.navJobId == jobId) {
            this.handle_catalog_click();
        }
    }

    /** Called when an item of the catalog is clicked. Closes the menu, fetches data associated
     * with a run, 
     */
    handle_catalog_click() {
        const catalogMenu = document.querySelector('.catalog-menu')
        var entryID = this.catEntry.job_id;
        var manifestPath = this.catEntry.manifest_path;
        var path = 'simulations/' + manifestPath;
        var description = this.catEntry.description;

        if (controllers.addSimulation.getValue()) {
            if (!controllers.addedSimulations.getValue().includes(description)) {
                controllers.addedSimulations.add(description);
                controllers.addSimulation.setValue(false, controllerEvents.setFalse);
                catalogMenu.classList.add('hidden');
            }
            return;
        }
        
        controllers.addedSimulations.setValue([]);
        controllers.addedSimulations.add(description);

        simVars.currentSimulation = entryID;
        document.querySelector('#current-sim-label').innerText = 'Shown simulation: ' + description;
        catalogMenu.classList.add('hidden');

        document.querySelector('#simulation-flags').classList.remove('hidden');
        getSimulation(path);
    }
}

window.customElements.define('catalog-item', CatalogItem);
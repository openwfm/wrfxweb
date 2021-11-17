import { getSimulation } from '../../services.js';
import { utcToLocal } from '../../util.js';
import { simVars } from '../../simVars.js';
import { controllers } from '../Controller.js';
import { simState } from '../../simState.js';

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
        let  { description, job_id, to_utc, from_utc } = this.catEntry;

        this.querySelector('h3').innerText = description;
        this.querySelector('#jobID').innerText += ' ' + job_id;
        this.querySelector('#from').innerText += ' ' + utcToLocal(from_utc);
        this.querySelector('#to').innerText += ' ' + utcToLocal(to_utc);

        this.initializeKMLURL();
        this.initializeZipURL();

        this.querySelector('#entry').onclick = () => {
            this.clickItem();
        }
        if (this.navJobId == job_id) {
            this.clickItem();
        }
    }

    initializeKMLURL() {
        let kmlURL = this.catEntry.kml_url;
        let kmlSize = this.catEntry.kml_size;

        if(kmlURL) {
            let mb = Math.round(10*kmlSize/1048576.0)/10;
            const kmlLink = this.querySelector('#kml');
            kmlLink.href = kmlURL;
            kmlLink.innerText = 'Download KMZ ' + mb.toString() + ' MB';
        }
    }

    initializeZipURL() {
        let zipURL = this.catEntry.zip_url;
        let zipSize = this.catEntry.zip_size;

        if(zipURL) {
            let mb = Math.round(10*zipSize/1048576.0)/10;
            const zipLink = this.querySelector('#zip');
            zipLink.href = zipURL;
            zipLink.innerText = 'Download ZIP ' + mb.toString() + ' MB';
        }
    }

    clickItem() {
        let entryID = this.catEntry.job_id;
        let manifestPath = this.catEntry.manifest_path;
        let path = 'simulations/' + manifestPath;
        let description = this.catEntry.description;

        // simVars.currentSimulation = entryID;
        // simVars.currentDescription = description;
        // document.querySelector('#current-sim-label').innerText = 'Shown simulation: ' + description;
        // document.querySelector('.catalog-menu').classList.add('hidden');

        // document.querySelector('#simulation-flags').classList.remove('hidden');
        // getSimulation(path);
        let simulationMetaData = {
            simId: entryID,
            description: description,
            path: path,
            manifestPath: manifestPath,
            // simVars.rasterBase = path.substring(0, path.lastIndexOf('/') + 1);
            rasterBase: path.replaceAll(':', '_').substring(0, path.lastIndexOf('/') + 1),
        };
        simState.changeSimulation(simulationMetaData);
    }
}

window.customElements.define('catalog-item', CatalogItem);
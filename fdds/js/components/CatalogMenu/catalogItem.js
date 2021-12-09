import { utcToLocal } from '../../utils/util.js';
import { simState } from '../../state/simState.js';

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
        this.uiElements = {
            entry: this.querySelector('#entry'),
            title: this.querySelector('h3'),
            jobIdLabel: this.querySelector('#jobID'),
            fromLabel: this.querySelector('#from'),
            toLabel: this.querySelector('#to'),
        };
    }

    connectedCallback() {
        let  { description, job_id, to_utc, from_utc } = this.catEntry;
        let { entry, title, jobIdLabel, fromLabel, toLabel } = this.uiElements;

        title.innerText = description;
        jobIdLabel.innerText += ' ' + job_id;
        fromLabel.innerText += ' ' + utcToLocal(from_utc);
        toLabel.innerText += ' ' + utcToLocal(to_utc);

        this.initializeKMLURL();
        this.initializeZipURL();

        entry.onclick = () => {
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

        let simulationMetaData = {
            simId: entryID,
            description: description,
            path: path,
            manifestPath: manifestPath,
            // rasterBase: path.substring(0, path.lastIndexOf('/') + 1),
            rasterBase: path.replaceAll(':', '_').substring(0, path.lastIndexOf('/') + 1),
        };
        simState.changeSimulation(simulationMetaData);
    }
}

window.customElements.define('catalog-item', CatalogItem);
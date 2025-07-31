import {
  getSimulation,
  getZip,
  getKml,
  zipUrl,
  kmlUrl,
  CATALOG_URL,
} from "../../clientServices.js";
//import { getSimulation } from "../../services.js";
import { utcToLocal } from "../../util.js";
import { simVars } from "../../simVars.js";
import { controllers } from "../Controller.js";

export class CatalogItem extends HTMLElement {
  constructor(catEntry, navJobId, catalogId) {
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
                    <a id='kml' class="hidden" download></a>
                    <a id='zip' class="hidden" download></a>
                </div>
            </li>
        `;
    this.catEntry = catEntry;
    this.navJobId = navJobId;
    this.catalogId = catalogId;
  }

  connectedCallback() {
    let { description, job_id, to_utc, from_utc, id } = this.catEntry;

    this.querySelector("h3").innerText = description;
    this.querySelector("#jobID").innerText += " " + job_id;
    this.querySelector("#from").innerText += " " + utcToLocal(from_utc);
    this.querySelector("#to").innerText += " " + utcToLocal(to_utc);

    this.initializeKMLURL();
    this.initializeZipURL();

    this.querySelector("#entry").onclick = () => {
      this.clickItem();
    };
    this.job_id = job_id;
  }

  initializeKMLURL() {
    const kmlLink = this.querySelector("#kml");
    let hasKml = this.catEntry.has_kml == "True";
    let kmlSize = this.catEntry.kml_size;

    if (hasKml) {
      kmlLink.href = kmlUrl(this.catalogId, this.catEntry.id);
      kmlLink.innerText = `Download KMZ ${kmlSize} MB`;
      kmlLink.classList.remove("hidden");
    } else {
      kmlLink.classList.add("hidden");
    }
  }

  initializeZipURL() {
    const zipLink = this.querySelector("#zip");
    let hasZip = this.catEntry.has_zip == "True";
    let zipSize = this.catEntry.zip_size;

    if (hasZip) {
      zipLink.href = zipUrl(this.catalogId, this.catEntry.id);
      zipLink.innerText = `Download ZIP ${zipSize} MB`;
      zipLink.classList.remove("hidden");
    } else {
      zipLink.classList.add("hidden");
    }
  }

  async clickItem() {
    let entryId = this.catEntry.id;
    let jobId = this.catEntry.job_id;
    let manifestPath = this.catEntry.manifest_path;
    let description = this.catEntry.description;

    simVars.currentSimulation = jobId;
    simVars.currentDescription = description;
    simVars.catalogId = this.catalogId;
    document.querySelector("#current-sim-label").innerText =
      "Shown simulation: " + description;
    document.querySelector(".catalog-menu").classList.add("hidden");

    document.querySelector("#simulation-flags").classList.remove("hidden");

    //let selectedSimulation = await getSimulation(this.catalogId, manifestPath);
    let selectedSimulation = await getSimulation(this.catalogId, entryId);

    simVars.rasters = selectedSimulation;
    //let simulationPathBase = `simulation/${manifestPath.substring(0, manifestPath.lastIndexOf("/"))}/`;
    let simulationPathBase = `entries/${entryId}/simulation/`;
    //simVars.rasterBase = `${CATALOG_URL}/${this.catalogId}/${simulationPathBase}`;

    simVars.rasterBase = `${CATALOG_URL}/${this.catalogId}/${simulationPathBase}`;

    // retrieve all domains
    controllers.domainInstance.setValue(Object.keys(selectedSimulation));
  }
}

window.customElements.define("catalog-item", CatalogItem);

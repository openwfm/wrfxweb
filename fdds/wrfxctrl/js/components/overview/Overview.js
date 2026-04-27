import { overviewHTML } from "./OverviewHTML.js";
import { getWrfxctrlJobs } from "../../services.js";
import { SimulationOverview } from "./SimulationOverview.js";

export class Overview extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = overviewHTML;
    this.uiElements = {
      tableBody: this.querySelector("#table-body"),
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this.populateTable();
  }

  async populateTable() {
    const { tableBody } = this.uiElements;
    let wrfxctrlJobs = await getWrfxctrlJobs();
    for (let wrfxctrlJob of wrfxctrlJobs) {
      let simulationOverview = new SimulationOverview(wrfxctrlJob);
      tableBody.appendChild(simulationOverview);
    }

    console.log(wrfxctrlJobs);
  }
}

window.customElements.define("overview", Overview);

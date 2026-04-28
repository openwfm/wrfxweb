import { wrfxctrlOverviewHTML } from "./WrfxctrlOverviewHTML.js";
import { getWrfxctrlJobs } from "../../services.js";

export class WrfxctrlOverview extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = wrfxctrlOverviewHTML;
    this.uiElements = {
      tableBody: this.querySelector("#table-body"),
    };
  }

  connectedCallback() {
    this.populateTable();
  }

  async populateTable() {
    const { tableBody } = this.uiElements;
    let wrfxctrlJobs = await getWrfxctrlJobs();
    for (let wrfxctrlJob of wrfxctrlJobs) {
      let simulationOverview = this.createWrfxctrlJobRow(wrfxctrlJob);
      tableBody.appendChild(simulationOverview);
    }
  }

  createWrfxctrlJobRow(wrfxctrlJob) {
    const wrfxctrlJobRow = document.createElement("tr");
    if (wrfxctrlJob.status == "complete") {
      wrfxctrlJobRow.innerHTML = `
            <td> <div class="ui checkbox"> <input type="checkbox" class="jobcb" name="sim_chk" value="${wrfxctrlJob.id}"><label></label></div> </td>
            <td> <a href=\"jobs/monitor/${wrfxctrlJob.id}\" target="_blank"> ${wrfxctrlJob.job_id} </a></td>
            <td> ${wrfxctrlJob.status} </td>
            <td> ${wrfxctrlJob.submit_time}  </td>
            <td> ${wrfxctrlJob.description} </td>
            <td id="visualization" className="hidden">
               <a href="/?job_id=${wrfxctrlJob.job_id}" target="_blank">visualization</a>
            </td>
            <td id="no-visualization"> no visualization </td>
        `;
    } else {
      wrfxctrlJobRow.innerHTML = `
            <td> <div class="ui checkbox"> <input type="checkbox" class="jobcb" name="sim_chk" value="${wrfxctrlJob.id}"><label></label></div> </td>
            <td> <a href=\"jobs/monitor/${wrfxctrlJob.id}\" target="_blank"> ${wrfxctrlJob.job_id} </a></td>
            <td> ${wrfxctrlJob.status} </td>
            <td> ${wrfxctrlJob.submit_time}  </td>
            <td> ${wrfxctrlJob.description} </td>
            <td id="no-visualization"> no visualization </td>
        `;
    }
    return wrfxctrlJobRow;
  }
}

window.customElements.define("wrfxctrl-overview", WrfxctrlOverview);

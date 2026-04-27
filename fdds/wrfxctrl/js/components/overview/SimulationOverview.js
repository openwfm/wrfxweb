export class SimulationOverview extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor(wrfxctrlJob) {
    super();
    this.innerHTML = `
            <tr>
              <td> <div class="ui checkbox"> <input type="checkbox" class="jobcb" name="sim_chk" value="{{sim_id}}" onClick="cb_func(this)"><label></label></div> </td>
              <td> <a href="jobs/monitor/${wrfxctrlJob.id}" target="_blank"> ${wrfxctrlJob.job_id} </a></td>
              <td> ${wrfxctrlJob.status} </td>
              <td> ${wrfxctrlJob.submit_time}  </td>
              <td> ${wrfxctrlJob.description} </td>
              <td id="visualization" className="hidden">
                 <a href="/?job_id=${wrfxctrlJob.job_id}" target="_blank">visualization</a>
              </td>
              <td id="no-visualization"> no visualization </td>
            </tr>
        `;
    this.catalog = wrfxctrlJob;
    this.uiElements = {
      visualization: this.querySelector("#visualization"),
      noVisualization: this.querySelector("#no-visualization"),
    };
  }

  connectedCallback() {
    const { visualization, noVisualization } = this.uiElements;

    if (this.wrfxctrlJob.status == "complete") {
      visualization.classList.remove("hidden");
      noVisualization.classList.add("hidden");
    }
  }
}

window.customElements.define("simulation-overview", SimulationOverview);

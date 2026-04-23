import { ignitionButtonHTML } from "./ignitionButtonHTML.js";
import { errorState } from "../../errorState.js";

export class IgnitionButton extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = ignitionButtonHTML;
    this.uiElements = {
      igniteButton: this.querySelector("#ignite-button"),
      form: document.getElementById("simulation_form"),
    };
    this.count = 0;
  }

  connectedCallback() {
    const { form, igniteButton } = this.uiElements;
    igniteButton.onclick = (event) => {
      event.preventDefault();
      let formIsValid = errorState.validateComponents();
      if (!formIsValid) return;
      form.submit();
    };
    form.addEventListener("formdata", ({ formData }) => {
      let formJson = errorState.buildJson();
      console.log(formJson);
      for (let key of Object.keys(formJson)) {
        formData.append(key, formJson[key]);
      }
    });
  }
}

window.customElements.define("ignition-button", IgnitionButton);

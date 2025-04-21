import { adminControllers } from "../adminControllers.js";

export class ConfirmationModal extends HTMLElement {
  constructor() {
    super();
    this.confirmation = () => { };
    this.innerHTML = `
            <div id="confirmation-mask" class="confirmation-mask hidden">
              <div id="confirmation-modal">
                <p>Are you sure? This action cannot be undone</p>
                <button id="yes-button" class="confirmation-button">Yes</button>
                <button id="cancel" class="confirmation-button">Cancel</button>
              </div>
            </div>
        `;
    this.uiElements = {
      confirmationMask: this.querySelector("#confirmation-mask"),
      confirmationModal: this.querySelector("#confirmation-modal"),
      cancelButton: this.querySelector("#cancel"),
      yesButton: this.querySelector("#yes-button"),
    };
  }

  connectedCallback() {
    const { yesButton, cancelButton } = this.uiElements;

    adminControllers.confirmation.subscribe(() => {
      this.open(adminControllers.confirmation.value);
    });
    yesButton.onclick = () => {
      this.confirmation();
      adminControllers.confirmation.reset();
      this.close();
    };
    cancelButton.onclick = () => {
      this.close();
    };
  }

  open(confirmation) {
    this.confirmation = confirmation;
    const { confirmationMask } = this.uiElements;
    confirmationMask.classList.remove("hidden");
  }

  close() {
    const { confirmationMask } = this.uiElements;
    this.confirmation = () => { };
    adminControllers.confirmation.reset();
    confirmationMask.classList.add("hidden");
  }
}

window.customElements.define("confirmation-modal", ConfirmationModal);

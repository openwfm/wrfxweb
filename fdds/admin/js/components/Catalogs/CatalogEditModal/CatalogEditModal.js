export class CatalogEditModal extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.innerHTML = `
            <div id='catalog-edit-modal-container'>
              <ul id='permissions-list'></ul>
            </div>
        `;
    this.uiElements = {
      permissionsList: this.querySelector("#permissions-list"),
    };
  }

  connectedCallback() { }
}

window.customElements.define("catalog-edit-modal", CatalogEditModal);

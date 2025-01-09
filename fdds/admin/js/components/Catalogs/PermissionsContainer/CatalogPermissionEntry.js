export class CatalogPermissionEntry extends HTMLElement {
  constructor(permission, deleteCallback, mutable = false) {
    super();
    this.permission = permission;
    this.deleteCallback = deleteCallback;
    this.mutable = mutable;
    this.innerHTML = `
            <li class='catalog-permission-entry'>
              <p id='permission-id'>${permission}</p>
              <button id='delete-permission-button'>x</button>
            </li>
        `;
    this.uiElements = {
      deletePermissionButton: this.querySelector("#delete-permission-button"),
    };
  }

  connectedCallback() {
    const { deletePermissionButton } = this.uiElements;
    deletePermissionButton.onclick = () => {
      this.deleteCallback(this);
    };
    if (!this.mutable) {
      deletePermissionButton.classList.add("hidden");
    }
  }
}

window.customElements.define(
  "catalog-permission-entry",
  CatalogPermissionEntry,
);

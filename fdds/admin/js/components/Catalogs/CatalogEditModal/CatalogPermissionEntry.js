export class CatalogPermissionEntry extends HTMLElement {
  constructor(permission, deleteCallback) {
    super();
    this.permission = permission;
    this.deleteCallback = deleteCallback;
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
  }
}

window.customElements.define(
  "catalog-permission-entry",
  CatalogPermissionEntry,
);

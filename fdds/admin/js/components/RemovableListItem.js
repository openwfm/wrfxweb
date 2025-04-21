import "./ConfirmationModal.js";
import { adminControllers } from "../adminControllers.js";

export class RemovableListItem extends HTMLElement {
  constructor(
    removableListItem,
    removeFunction,
    itemClass = "list_item_class",
  ) {
    super();
    this.listItem = removableListItem;
    this.removeFunction = removeFunction;
    this.innerHTML = `
            <li class=${itemClass} id="list-item">
              ${removableListItem.innerHTML}
              <button id="delete-button">delete</button>
            </li>
        `;
    this.uiElements = {
      listItem: this.querySelector("#list-item"),
      deleteButton: this.querySelector("#delete-button"),
    };
  }

  connectedCallback() {
    const { deleteButton } = this.uiElements;
    deleteButton.onclick = () => {
      adminControllers.confirmation.setValue(this.removeFunction);
    };
  }
}

window.customElements.define("removable-list-item", RemovableListItem);

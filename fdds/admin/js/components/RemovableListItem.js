import "./ConfirmationModal.js";
import { adminControllers } from "../adminControllers.js";

export class RemovableListItem extends HTMLElement {
  constructor(removableListItem, removeFunction, buttonText = "Delete") {
    super();
    this.listItem = removableListItem;
    this.removeFunction = removeFunction;
    this.innerHTML = `
            <li class="list_item_class" id="list-item">
              <div>
                ${removableListItem.innerHTML}
              </div>
              <button id="delete-button" class="removable-list-item">${buttonText}</button>
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

export class ListItem extends HTMLElement {
  constructor(list_item, list_item_class = "list_item_class") {
    super();
    this.list_entry = list_item;
    this.innerHTML = `
            <li class=${list_item_class} id="list_item">
            </li>
        `;
    this.uiElements = {
      listItem: this.querySelector("#list_item"),
    };
  }

  connectedCallback() {
    const { listItem } = this.uiElements;
    listItem.appendChild(this.list_entry);
  }
}

window.customElements.define("list-item", ListItem);

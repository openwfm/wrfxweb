export class LayerTabs extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div id='added-simulations'>
                <div class='tab' id='add-simulation'>+</div>
            </div>
        `;
    }
}

window.customElements.define('layer-tabs', LayerTabs);
export class LayerTabs extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div id='added-simulations'>
                <div class='tab' id='add-simulation'>
                    <div class='interactive-button innerTab'>+</div>
                </div>
            </div>
        `;

        this.activeTab = null;
    }

    makeNewTab(id) {
        const addedSimulations = this.querySelector('#added-simulations');
        const addSimulation = this.querySelector('#add-simulation');

        const newTab = document.createElement('div');
        newTab.classList.add('tab');
        const innerTab = document.createElement('div');
        innerTab.classList.add('interactive-button');
        innerTab.classList.add('innerTab');
        innerTab.innerText = id;
        newTab.appendChild(innerTab);

        addedSimulations.insertBefore(newTab, addSimulation)
        newTab.onclick = () => {
            this.switchActiveTab(newTab);
        }
    }

    connectedCallback() {
        const addSimulation = this.querySelector('#add-simulation');
        addSimulation.onclick = () => {
            this.makeNewTab('1');
        }
    }

    switchActiveTab(newTab) {
        if (this.activeTab == newTab) {
            return;
        }
        if (this.activeTab) {
            this.activeTab.classList.remove('active');
        }
        this.activeTab = newTab;
        this.activeTab.classList.add('active');
    }

}

window.customElements.define('layer-tabs', LayerTabs);
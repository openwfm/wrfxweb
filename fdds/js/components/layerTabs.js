import { controllerEvents, controllers } from './Controller.js';

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
        this.tabs = {};
        this.tabOrder = [];
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

        this.tabs[id] = newTab;
        addedSimulations.insertBefore(newTab, addSimulation)
        this.switchActiveTab(id);
        newTab.onpointerdown = () => {
            this.switchActiveTab(id);
        }
        newTab.ondblclick = () => {
            this.removeTab(id)
        }
    }

    removeTab(tabDescription) {
        if (this.tabOrder.length <= 1) {
            return;
        }

        const addedSimulations = this.querySelector('#added-simulations');
        var tab = this.tabs[tabDescription];
        var index = this.tabOrder.indexOf(tabDescription);

        this.tabOrder.splice(index, 1);
        if (this.activeTab == tab) {
            this.switchActiveTab(this.tabOrder[0]);
        }
        delete this.tabs[tabDescription];

        controllers.addedSimulations.remove(tabDescription);
        addedSimulations.removeChild(tab);
    }

    connectedCallback() {
        const addSimulation = this.querySelector('#add-simulation');
        addSimulation.onclick = () => {
            controllers.addSimulation.setValue(true, controllerEvents.setTrue);
        }
        controllers.addedSimulations.subscribe((simName) => {
            this.makeNewTab(simName);
        }, controllers.addedSimulations.addEvent);
        const addedSimulations = this.querySelector('#added-simulations');
        controllers.addedSimulations.subscribe(() => {
            for (var tabDescription in this.tabs) {
                var tab = this.tabs[tabDescription];
                addedSimulations.removeChild(tab);
            }
            this.tabs = {};
            for (var simulation of controllers.addedSimulations.getValue()) {
                this.makeNewTab(simulation);
            }
        });
    }

    switchActiveTab(activeDescription) {
        var newTab = this.tabs[activeDescription];
        if (this.activeTab == newTab) {
            return;
        }
        if (this.activeTab) {
            this.activeTab.classList.remove('active');
        }
        var index = this.tabOrder.indexOf(activeDescription);
        if (index >= 0) {
            this.tabOrder.splice(index, 1);
        }
        this.tabOrder.push(activeDescription);
        this.activeTab = newTab;
        this.activeTab.classList.add('active');
    }

}

window.customElements.define('layer-tabs', LayerTabs);
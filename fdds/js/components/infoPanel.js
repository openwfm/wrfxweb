class InfoPanel extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <link rel='stylesheet' href='css/infoPanel.css'/>
            <div id='infoPanelContainer'>
                <button id='infoButton'>
                    <img src='icons/info_black_24dp.svg'></img>
                </button></div>
                <div id='infoPanel'>
                    <span id='closeInfoPanel'>x</span>
                    <h2>Feature List and Components</h2>
                    <h3>Catalog Menu</h3>
                        <p>The Catalog Menu shows all available simulations that can 
                        be shown on the current account. </p>
                        <p>To access the menu click the Catalog button in the 
                        top left of the screen</p>
                        <h4>Searching and Ordering Catalog<h4>
                    <div id='break' style='width: 100%; height: 1px; background: #5d5d5d'></div>
                    <h3>Layer Controller</h3>
                        <h4>Layer Selection</h4>
                        <h4>Top Layer Opacity</h4>
                        <h4>TimeSeries Markers</h4>
                        <h4>TimeSeries Chart</h4>
                    <div id='break' style='width: 100%; height: 1px; background: #5d5d5d'></div>
                    <h3>Simulation Controller</h3>
                        <h4>Simulation Start and Stop Times</h4>
                        <p>Description of simulation start and stop times</p>
                        <p>How to use simulation start and stop times</p>
                    <div id='break' style='width: 100%; height: 1px; background: #5d5d5d'></div>
                    <h3>Domain Selector</h3>
                    <div id='break' style='width: 100%; height: 1px; background: #5d5d5d'></div>
                    <h3>Url Navigation</h3>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        const infoButton = this.querySelector('#infoButton');
        const infoPanel = this.querySelector('#infoPanel');
        const closePanel = this.querySelector('#closeInfoPanel');
        L.DomEvent.disableClickPropagation(infoButton);
        L.DomEvent.disableClickPropagation(infoPanel);

        infoButton.onclick = () => {
            if (infoPanel.classList.contains('clicked')) {
                infoPanel.classList.remove('clicked');
            } else {
                infoPanel.classList.add('clicked');
            }
        }
        infoButton.onmouseover = () => {
            infoPanel.classList.add('hovered');
        }
        infoButton.onmouseout = () => {
            infoPanel.classList.remove('hovered');
        }
        closePanel.onclick = () => {
            infoPanel.classList.remove('clicked');
        }
    }
}

window.customElements.define('info-panel', InfoPanel);
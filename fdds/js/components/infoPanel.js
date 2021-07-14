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
                        <p>
                            The Catalog Menu shows all available simulations that can 
                            be shown on the current account.
                            <br>
                            To access the menu click the Catalog button in the 
                            top left of the screen
                        </p>
                        <h4>Searching and Ordering Catalog<h4>
                    <div id='break' style='width: 100%; height: 1px; background: #5d5d5d'></div>
                    <h3>Layer Controller</h3>
                        <p>
                            The Layer Controler is found on the right hand side of the screen after a simulation has
                            been selected from the Catalog Menu. It shows the different layers that can be shown in the 
                            current simulation and domain.
                        </p>
                        <h4>Layer Selection</h4>
                        <p>
                            Selecting a layer from the Layer Controller adds it to the map and centers the map on the layer.
                            The layer may also show a colorbar that will appear on the left hand side of the screen. Adding a
                            layer will load the layer over the entire simulation (or a specified range of the simulation). The 
                            Simulation Controller shows the progress of loading the simulation. Multiple
                            layers can be added at once, with the most recently added layer considered the 'top' layer. Clicking
                            an added layer in the Layer Controller removes that layer. If the 'top' layer is removed, the most
                            recently added layer before that layer becomes the new 'top' layer. The colorbar shown is always the
                            most recently added layer that has a colorbar.
                        </p>
                        <h4>Switching Domains</h4>
                        <p>
                            When switching domains, all the currently added layers will be preserved if those layers exist in the
                            new domain. If they do not, the layer will be removed and will have to be re added if needed when returning
                            to the original domain.
                        <p>
                        <h4>Top Layer Opacity</h4>
                    <div id='break' style='width: 100%; height: 1px; background: #5d5d5d'></div>
                    <h3>Time Series Generation</h3>
                        <h4>TimeSeries Markers</h4>
                        <h4>TimeSeries Chart</h4>
                    <div id='break' style='width: 100%; height: 1px; background: #5d5d5d'></div>
                    <h3>Simulation Controller</h3>
                        <p>
                            The Simulation Controller is found in the bottom left of the screen after a simulation 
                            has been selected from the Catalog Menu. It shows the current timestamp in the simulation
                            as well as a bar showing the relative location of the current timestamp in full simulation. 
                            The Simulation Controller is used to start and stop the simulation, navigate to a specific time, 
                            and control whether the full simulation is loaded, or only subset of the simulation is loaded. 
                        <p>
                        <h4>Basic Navigation</h4>
                        <p>
                            Pressing Play will begin playing the simulation and advancing the timestamp. Pressing 
                            the outer double arrows toggle speeding up or slowing down the simulation.
                            From a paused position, clicking either of the inner arrows either advances
                            the simulation by a single timestamp or goes back to the previous timestamp. 
                            From the last timestamp of the simulation, advancing returns to the start, and 
                            from the first timestamp, going back goes to the last timestamp of the simulation.
                            Users can also click the bar below the navigation buttons to navigate to a relative
                            location in the simulation. Alternatively the seeker showing the relative location in 
                            the simulation can be clicked and dragged to a new location. 
                        </p>
                        <h4>Simulation Start and Stop Times</h4>
                        <h4>Loading Progress</h4>
                        <p>Description of simulation start and stop times</p>
                        <p>How to use simulation start and stop times</p>
                    <div id='break' style='width: 100%; height: 1px; background: #5d5d5d'></div>
                    <h3>Domain Selector</h3>
                    <div id='break' style='width: 100%; height: 1px; background: #5d5d5d'></div>
                    <h3>Url Navigation</h3>
                    <p>
                        As various settings like timestamp, selected layers, opacity, etc, are adjusted, these
                        properties are saved as parameters in the URL. Clicking the 'Copy Link to Clipboard' button
                        will copy the current URL so it can be saved or shared. Navigating to this link in the browser
                        will return the simulation to the state it was in when the URL was copied. The URL can also be
                        copied directly. 
                    </p>
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
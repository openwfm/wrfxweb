export function createTimeSeriesMarkerHTML(latLon) {
    const roundLatLon = (num) => Math.round(num*100)/100; 
    const timeSeriesMarkerHTML = `
        <div id='timeSeriesMarker'>
            <div id='marker-menu'>
                <span id='hideMenu' class='hideMenu interactive-button'>hide</span>
                <div>
                    <label style='display: inline-block; width: 100px' for='timeseries-custom-name'>Add name: </label>
                    <input id='timeseries-custom-name'></input>
                </div>

                <div>
                    <span style='margin: 1px; margin-right: 10px'>lat: ${roundLatLon(latLon.lat)} lon: ${roundLatLon(latLon.lng)}</span>
                    <span id='rgb-value' style='margin:0'>No layer with colorbar to show values</span>
                </div>
                <p id='colorbar-location' style='margin: 0'></p>
                <button class='timeSeriesButton' id='open-timeseries-menu'>generate timeseries</button>
            </div>

            <div id='timeseries-menu' class='hidden'>
                <span id='close-timeseries-menu' class='hideMenu interactive-button'>cancel</span>
            </div>
        </div>
    `;
    return timeSeriesMarkerHTML;
}
 
export const simulationStartAndEndTimesHTML = `
        <div>
            <h3>Simulation Start and End Times</h3>
            <div id="start-end-dates" class="two fields">
                <div id="start-dates" class="field" style="margin-bottom: 15px">
                    <label>Simulation Start</label>
                    <div class="ui input left icon">
                        <i class="calendar icon"></i>
                        <input name="ignition_start" id="start-time-input" type="text" placeholder="YYYY-MM-DD_HH:MM:SS">
                    </div>
                    <span id="ignition-time-warning" class="not-valid-warning">The ignition time must be between 1/1/1979 and now in the format YYYY-MM-DD_HH:MM:SS</span>
                </div>
                <div id="end-dates" class="field">
                    <label>Simulation End</label>
                    <div class="ui input left icon">
                        <i class="calendar icon"></i>
                        <input name="ignition_end" id="end-time-input" type="text" placeholder="YYYY-MM-DD_HH:MM:SS">
                    </div>
                    <span id="ignition-time-warning" class="not-valid-warning">The ignition time must be between 1/1/1979 and now in the format YYYY-MM-DD_HH:MM:SS</span>
                </div>
            </div>
        </div>
        `;

export const cycleStartHTML = `
        <div>
            <h3 id="cycle-start-header" class="hidden">Cyle Start Time</h3>
            <div id="cycle-dates" >
                <div id="cycle-start-option-field" class="field" style="margin-bottom: 15px">
                  <div id="cycle-start-option-container" class="field">
                      <label for="cycle-start-option">Choose Cycle Start</label>
                      <input type="checkbox" name="cycle-start-option" id="cycle-start-option"/>
                  </div>
                </div>
                <div id="cycle-start" class="field hidden" style="margin-bottom: 15px">
                    <label>Cycle Start</label>
                    <div class="ui input left icon">
                        <i class="calendar icon"></i>
                        <input name="cycle_start" id="cycle-start-input" type="text" placeholder="YYYY-MM-DD_HH:MM:SS">
                    </div>
                    <span id="ignition-time-warning" class="not-valid-warning">The cycle start time must be between 1/1/1979 and now in the format YYYY-MM-DD_HH:MM:SS</span>
                </div>
            </div>
        </div>
        `;

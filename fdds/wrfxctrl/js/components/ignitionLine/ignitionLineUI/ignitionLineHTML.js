export const ignitionLineHTML = `
    <div id="ignition-line-component">
        <h3>Ignition Line</h3>
        <div class="field" style="display: inline-block;">
          <label>Split times evenly between start and end</label>
          <input type="checkbox" id="start-end-checkbox" value="split-start-end">
        </div>
        <div id="ignition-times">
          <div class="two fields" style="margin-bottom: 15px">
            <div id="start-dates" class="field">
              <label>First Ignition</label>
              <div class="ui input left icon">
                  <i class="calendar icon"></i>
                  <input name="ignition_start" id="start-ignition-input" type="text" placeholder="YYYY-MM-DD_HH:MM:SS">
              </div>
              <span id="ignition-time-warning" class="not-valid-warning">The ignition time must be between 1/1/1979 and now in the format YYYY-MM-DD_HH:MM:SS</span>
            </div>
            <div id="end-dates" class="field">
              <label>End Ignition</label>
              <div class="ui input left icon">
                <i class="calendar icon"></i>
                <input name="ignition_end" id="end-ignition-input" type="text" placeholder="YYYY-MM-DD_HH:MM:SS">
              </div>
              <span id="ignition-time-warning" class="not-valid-warning">The ignition time must be between 1/1/1979 and now in the format YYYY-MM-DD_HH:MM:SS</span>
            </div>
          </div>
        </div>
        <div id="ignition-line-markers" class="ignition-markers"></div> 
    </div>
`;
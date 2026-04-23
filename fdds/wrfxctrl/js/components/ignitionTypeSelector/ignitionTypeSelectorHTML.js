export const ignitionTypeSelectorHTML = `
    <div class="marker-buttons">
        <div id="ignition-type-container" class="two fields">
          <div id="ignition-type-field" class="field">
              <label>Marker Type</label>
              <select name="ignition_type" id="ignition-type-dropdown">
                  <option value="0">Domain Center</option>
                  <option id="multiple-ignitions" value="1">Multiple Ignitions</option>
                  <option id="ignition-line" value="2">Ignition Line</option>
                  <option value="3">Burn Plot Boundary</option>
              </select>
          </div>
          <div id="use-realtime-container" class="field">
              <label for="use-realtime-option">IR+VIIRS Interp</label>
              <input type="checkbox" name="use-realtime-option" id="use-realtime-option"/>
          </div>
        </div>
        <!-- <div class="field" style="display: inline-block;">
            <label>Show GIS Hotspots</label>
            <input type="checkbox" id="show-sat-data" value="sat-data">
        </div> -->
    </div>
`;

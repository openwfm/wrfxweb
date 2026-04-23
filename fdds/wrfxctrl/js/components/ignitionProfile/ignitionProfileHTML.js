export const ignitionProfileHTML = `
<div>
  <h2>Step 3: Simulation profile</h2>
  <div class="ui two column grid">
    <div class="column">
      <div id="domain-selector" class="field">
          <label>Domain</label>
          <select name="domain" id="domain-dropdown">
          </select>
      </div>
      <div class="field">
        <span id="profile-warning" class="not-valid-warning">Please select a job profile.</span>
        <div id="profile-menu" class="ui fluid vertical pointing menu">
          <input type="hidden" name="profile" id="profile"/>
        </div>
      </div>
    </div>

    <div class="column">
      <h3>Profile description</h3>
      <p id="profile-info-text">
        Select a simulation profile from the dropdown box.  The simulation profile will specify parameters of your job not set in this form.
      </p>
    </div>
  </div>
  <br/>
  <br/>
  <div id="optimize-disk-space-option" class="field">
      <label for="optimize-disk-space">Optimize Disk Space</label>
      <input type="checkbox" name="optimize-disk-space" id="optimize-disk-space"/>
  </div>
</div>
`;

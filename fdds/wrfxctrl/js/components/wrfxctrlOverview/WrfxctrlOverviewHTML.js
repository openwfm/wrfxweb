export const wrfxctrlOverviewHTML = `
  <div class="ui one column stackable center aligned page grid">
    <div class="column sixteen wide">
      <form class="ui form" id="overview" method="POST">
      <h1>List of fire simulations</h1>
        <br />
        <table class="ui celled sortable table" id="sim-table">
          <thead>
            <tr>
              <th> </th>
              <th>Simulation identifier</th>
              <th>Status</th>
              <th id="sim-started-at">Started at</th>
              <th>Description</th>
              <th>Visualization</th>
            </tr>
          </thead>
          <tbody id="table-body">
          </tbody>
       </table>
       <input class="ui left floated red button" type="submit" id="RemoveButton" name="RemoveB" value="Remove" />
       <input class="ui left floated red button" type="submit" id="CancelButton" name="CancelB" value="Cancel" />
       <a href="/jobs" class="ui right floated blue button">Home</a>
       <a href="/jobs/build" class="ui right floated red button"><i class="fire icon"></i>Start a new fire</a>
       <p id="acknowledgement"> <a href="https://wildfirecenter.org/" target="_blank">SJSU WIRC, Fire Modeling Group, <script>document.write(new Date().getFullYear())</script></a></p>
     </div>
  </div>
`;

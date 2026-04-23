"use strict";

var sim_id = $('#sim-id').text();
var sim_info = null;
var start_time = null;

$.getJSON("/sim_info/" + sim_id, function(data) {
  sim_info = data;
  //console.log(sim_info['started_at']);
  start_time = moment(sim_info['started_at'], "YYYY-MM-DD_HH:mm:ss");
  //console.log(start_time);
  update_time_since_start();
  if(start_time < moment().subtract(1, 'minutes')) {
    get_job_state();
  } else {
    window.setTimeout(get_job_state, 5000);
  }
});

function update_time_since_start()
{
  $('#run-time').text(start_time.from(moment()));
  $('#current-time').text(moment().format('ddd, MMMM Do YYYY, HH:mm:ss'));
  window.setTimeout(update_time_since_start, 1000);
}

function get_job_state()
{
  var state_map = { 'waiting' : '<div class="ui grey loading label">Waiting <div style="margin-left:5px;" class="ui active small inline loader"></div></div>',
                'running' : '<div class="ui yellow label">Running</div>',
                'downloading' : '<div class="ui yellow label">Downloading</div>',
                'complete' : '<div class="ui green label">Success</div>',
                'available' : '<div class="ui green label">Available</div>',
                'failed' : '<div class="ui red label">Failed</div>',
                'submit' : '<div class="ui orange label">Submitted</div>' };

    $.getJSON("/get_state/" + sim_id, function(state) {
      for(var tag in state) {
        $('#'+tag).empty();
        $('#'+tag).append(state_map[state[tag]]);
    }

    // stop querying the state repeatedly after the job is complete
    if(state['wrf'] != 'complete' && !job_failed(state)) {
      window.setTimeout(get_job_state, 5000);
    }

  });
}

function job_failed(state) {
  return 'failed' in $.map(state, function(value, key) { return value })
}


function retrieve_and_show_log()
{
  $.get("/retrieve_log/" + sim_id, function(txt) {
    $('#log').text(txt);
    $('#log').attr('rows', 40);
    $('html, body, .content').animate({scrollTop: $(document).height()}, 1500);
  });
}


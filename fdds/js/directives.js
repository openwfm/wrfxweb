'use strict';

/* Directives */
angular.module('fdApp.directives', []).

  directive('appVersion', ['app_version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]).

  directive('srvVersion', ['srv_version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    }
  }]);

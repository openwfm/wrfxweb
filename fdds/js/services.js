'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('fdApp.services', []).
  value('app_version', '0.5').
  value('srv_version', '0.9');

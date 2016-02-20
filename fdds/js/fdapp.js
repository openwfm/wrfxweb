'use strict';


// Declare app level module which depends on filters, and services
angular.module('fdApp', [
  'ngRoute',
  'fdApp.filters',
  'fdApp.services',
  'fdApp.directives',
  'fdApp.controllers'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {templateUrl: 'partials/partial1.html', controller: 'map_ctrl'});
  $routeProvider.when('/view2', {templateUrl: 'partials/partial2.html', controller: 'sys_ctrl'});
  $routeProvider.when('/view3', {templateUrl: 'partials/partial3.html' });
  $routeProvider.when('/view4', {templateUrl: 'partials/partial4.html' });
  $routeProvider.otherwise({redirectTo: '/view1'});
}]);

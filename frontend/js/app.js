angular.module('automataApp', ['ngRoute']).config(function($routeProvider, $locationProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'views/dashboard.html',
      controller: 'DashboardController',
    })
    .when('/create', {
      templateUrl: 'views/create.html',
      controller: 'CreateController',
    })
    .when('/edit/:id', {
      templateUrl: 'views/edit.html',
      controller: 'EditController',
    })
    .when('/simulate/:id', {
      templateUrl: 'views/simulate.html',
      controller: 'SimulateController',
    })
    .otherwise({
      redirectTo: '/',
    });

  $locationProvider.hashPrefix('');
});

angular
  .module("automataApp", ["ngRoute"])
  .config(function ($routeProvider, $locationProvider) {
    $routeProvider
      .when("/login", {
        templateUrl: "views/login.html",
        controller: "LoginController",
      })
      .when("/register", {
        templateUrl: "views/register.html",
        controller: "RegisterController",
      })
      .when("/profile", {
        templateUrl: "views/profile.html",
        controller: "ProfileController",
      })
      .when("/", {
        templateUrl: "views/dashboard.html",
        controller: "DashboardController",
      })
      .when("/create", {
        templateUrl: "views/create.html",
        controller: "CreateController",
      })
      .when("/edit/:id", {
        templateUrl: "views/edit.html",
        controller: "EditController",
      })
      .when("/simulate/:id", {
        templateUrl: "views/simulate.html",
        controller: "SimulateController",
      })
      .when("/shared/:shareId", {
        templateUrl: "views/simulate.html",
        controller: "SimulateController",
      })
      .otherwise({
        redirectTo: "/",
      });

    $locationProvider.hashPrefix("");
  })
  .controller("MainController", function ($scope, $location, AuthService) {
    $scope.auth = {
      isAuthenticated: AuthService.isAuthenticated,
      getUser: AuthService.getCurrentUser,
    };

    $scope.navigate = function (path) {
      $location.path(path);
    };

    $scope.logout = function () {
      AuthService.logout().finally(function () {
        $location.path("/login");
      });
    };
  });

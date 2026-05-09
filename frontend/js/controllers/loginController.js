angular
  .module("automataApp")
  .controller("LoginController", function ($scope, $location, AuthService) {
    $scope.form = {
      email: "",
      password: "",
    };
    $scope.error = null;

    $scope.login = function () {
      $scope.error = null;
      AuthService.login($scope.form).then(
        function () {
          $location.path("/");
        },
        function (error) {
          $scope.error = (error.data && error.data.error) || "Login failed";
        },
      );
    };
  });

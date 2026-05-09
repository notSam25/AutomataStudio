angular
  .module("automataApp")
  .controller("RegisterController", function ($scope, $location, AuthService) {
    $scope.form = {
      username: "",
      email: "",
      password: "",
    };
    $scope.error = null;

    $scope.register = function () {
      $scope.error = null;
      AuthService.register($scope.form).then(
        function () {
          $location.path("/");
        },
        function (error) {
          $scope.error = (error.data && error.data.error) || "Registration failed";
        },
      );
    };
  });

angular
  .module("automataApp")
  .controller("ProfileController", function ($scope, $location, AuthService) {
    if (!AuthService.isAuthenticated()) {
      $location.path("/login");
      return;
    }

    $scope.loading = true;
    $scope.error = null;
    $scope.success = null;
    $scope.form = {
      username: "",
      email: "",
    };

    AuthService.fetchMe().then(
      function (response) {
        $scope.form.username = response.data.user.username;
        $scope.form.email = response.data.user.email;
        $scope.loading = false;
      },
      function () {
        $scope.error = "Failed to load profile";
        $scope.loading = false;
      },
    );

    $scope.save = function () {
      $scope.error = null;
      $scope.success = null;

      AuthService.updateProfile({ username: $scope.form.username }).then(
        function (response) {
          $scope.form.username = response.data.user.username;
          $scope.success = "Profile updated";
        },
        function (error) {
          $scope.error = (error.data && error.data.error) || "Update failed";
        },
      );
    };
  });

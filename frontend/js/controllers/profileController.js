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
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
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

      if ($scope.form.newPassword && $scope.form.newPassword !== $scope.form.confirmPassword) {
        $scope.error = "New passwords do not match";
        return;
      }

      const payload = {
        username: $scope.form.username,
        email: $scope.form.email,
      };

      if ($scope.form.newPassword) {
        payload.oldPassword = $scope.form.oldPassword;
        payload.newPassword = $scope.form.newPassword;
      }

      AuthService.updateProfile(payload).then(
        function (response) {
          $scope.form.username = response.data.user.username;
        $scope.form.email = response.data.user.email;
        $scope.form.oldPassword = "";
        $scope.form.newPassword = "";
        $scope.form.confirmPassword = "";
          $scope.success = "Profile updated";
        },
        function (error) {
          $scope.error = (error.data && error.data.error) || "Update failed";
        },
      );
    };
  });

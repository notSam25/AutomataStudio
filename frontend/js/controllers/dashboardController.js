angular
  .module("automataApp")
  .controller(
    "DashboardController",
    function ($scope, $location, $window, AutomataService, AuthService) {
      $scope.automata = [];
      $scope.loading = true;
      $scope.error = null;
      $scope.isAuthenticated = AuthService.isAuthenticated;

      // Load all automata on init
      const loadAutomata = function () {
        AutomataService.getAllAutomata().then(
          function (response) {
            $scope.automata = response.data;
            $scope.loading = false;
          },
          function (error) {
            $scope.error = "Failed to load automata: " + error.statusText;
            $scope.loading = false;
            console.error(error);
          },
        );
      };

      // Delete automata
      $scope.deleteAutomata = function (id, name) {
        if (!AuthService.isAuthenticated()) {
          $location.path("/login");
          return;
        }

        if (confirm('Are you sure you want to delete "' + name + '"?')) {
          AutomataService.deleteAutomata(id).then(
            function (response) {
              alert("Automata deleted successfully");
              loadAutomata();
            },
            function (error) {
              alert("Error deleting automata: " + error.statusText);
              console.error(error);
            },
          );
        }
      };

      // Navigate to create
      $scope.createNew = function () {
        if (!AuthService.isAuthenticated()) {
          $location.path("/login");
          return;
        }

        $location.path("/create");
      };

      // Navigate to view/simulate
      $scope.viewAutomata = function (id) {
        $location.path("/simulate/" + id);
      };

      // Navigate to edit
      $scope.editAutomata = function (id) {
        if (!AuthService.isAuthenticated()) {
          $location.path("/login");
          return;
        }

        $location.path("/edit/" + id);
      };

      $scope.shareAutomata = function (id) {
        if (!AuthService.isAuthenticated()) {
          $location.path("/login");
          return;
        }

        AutomataService.createShareLink(id).then(
          function (response) {
            const shareHash = response.data.shareUrl;
            const fullUrl = $window.location.origin + shareHash;
            $window.navigator.clipboard.writeText(fullUrl).then(
              function () {
                alert("Share link copied to clipboard:\n" + fullUrl);
              },
              function () {
                alert("Share link:\n" + fullUrl);
              },
            );
          },
          function (error) {
            alert("Error creating share link: " + error.statusText);
          },
        );
      };

      $scope.exportAutomata = function (id) {
        const url = AutomataService.getExportUrl(id);
        const token = AuthService.getToken();

        $window.fetch(url, {
          headers: token ? { Authorization: "Bearer " + token } : {},
        }).then(async function (response) {
          if (!response.ok) {
            alert("Failed to export automata");
            return;
          }

          const blob = await response.blob();
          const downloadUrl = $window.URL.createObjectURL(blob);
          const link = $window.document.createElement("a");
          link.href = downloadUrl;
          link.download = "automata-export.json";
          $window.document.body.appendChild(link);
          link.click();
          link.remove();
          $window.URL.revokeObjectURL(downloadUrl);
        });
      };

      loadAutomata();
    },
  );

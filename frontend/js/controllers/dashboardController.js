angular
  .module("automataApp")
  .controller(
    "DashboardController",
    function ($scope, $location, AutomataService) {
      $scope.automata = [];
      $scope.loading = true;
      $scope.error = null;

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
        $location.path("/create");
      };

      // Navigate to view/simulate
      $scope.viewAutomata = function (id) {
        $location.path("/simulate/" + id);
      };

      // Navigate to edit
      $scope.editAutomata = function (id) {
        $location.path("/edit/" + id);
      };

      loadAutomata();
    },
  );

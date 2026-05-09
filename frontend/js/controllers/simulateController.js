angular
  .module("automataApp")
  .controller(
    "SimulateController",
    function ($scope, $routeParams, $interval, AutomataService) {
      $scope.automata = {};
      $scope.input = "";
      $scope.result = null;
      $scope.loading = true;
      $scope.simulating = false;
      $scope.error = null;
      $scope.history = [];

      // Animation controls
      $scope.isAnimating = false;
      $scope.currentStepIndex = -1;
      $scope.activeStep = null;
      let animationPromise = null;

      const loadAutomata = function () {
        const request = $routeParams.shareId
          ? AutomataService.getAutomataByShareId($routeParams.shareId)
          : AutomataService.getAutomataById($routeParams.id);

        request.then(
          function (response) {
            $scope.automata = response.data;
            $scope.loading = false;
            loadHistory();
          },
          function (error) {
            $scope.error = "Failed to load automata: " + error.statusText;
            $scope.loading = false;
            console.error(error);
          },
        );
      };

      // Load simulation history
      const loadHistory = function () {
        if (!$scope.automata || !$scope.automata._id) {
          return;
        }

        AutomataService.getSimulationHistory($scope.automata._id).then(
          function (response) {
            $scope.history = response.data;
          },
          function (error) {
            console.error("Failed to load history:", error);
          },
        );
      };

      // Run simulation
      $scope.simulate = function () {
        $scope.error = null;
        $scope.result = null;
        $scope.simulating = true;
        $scope.currentStepIndex = -1;
        $scope.activeStep = null;
        $scope.isAnimating = false;

        if (!$scope.input) {
          $scope.error = "Please enter an input string";
          $scope.simulating = false;
          return;
        }

        const automataId = $scope.automata && $scope.automata._id;

        AutomataService.simulateAutomata(automataId, $scope.input).then(
          function (response) {
            $scope.result = response.data;
            $scope.simulating = false;
            loadHistory();
            // Reset to first step
            if ($scope.result.steps && $scope.result.steps.length > 0) {
              $scope.currentStepIndex = 0;
              $scope.activeStep = $scope.result.steps[0];
            }
          },
          function (error) {
            $scope.error = "Simulation error: " + error.statusText;
            $scope.simulating = false;
            console.error(error);
          },
        );
      };

      // Step forward
      $scope.stepForward = function () {
        $scope.isAnimating = false;
        if (animationPromise) {
          $interval.cancel(animationPromise);
        }

        if ($scope.result && $scope.result.steps) {
          if ($scope.currentStepIndex < $scope.result.steps.length - 1) {
            $scope.currentStepIndex++;
            $scope.activeStep = $scope.result.steps[$scope.currentStepIndex];
          }
        }
      };

      // Step backward
      $scope.stepBackward = function () {
        $scope.isAnimating = false;
        if (animationPromise) {
          $interval.cancel(animationPromise);
        }

        if ($scope.currentStepIndex > 0) {
          $scope.currentStepIndex--;
          $scope.activeStep = $scope.result.steps[$scope.currentStepIndex];
        }
      };

      // Play animation
      $scope.playAnimation = function () {
        if ($scope.isAnimating || !$scope.result || !$scope.result.steps)
          return;

        $scope.isAnimating = true;

        animationPromise = $interval(function () {
          if ($scope.currentStepIndex < $scope.result.steps.length - 1) {
            $scope.currentStepIndex++;
            $scope.activeStep = $scope.result.steps[$scope.currentStepIndex];
          } else {
            // Stop at last step
            $scope.isAnimating = false;
            $interval.cancel(animationPromise);
          }
        }, 800);
      };

      // Pause animation
      $scope.pauseAnimation = function () {
        $scope.isAnimating = false;
        if (animationPromise) {
          $interval.cancel(animationPromise);
        }
      };

      // Cleanup on destroy
      $scope.$on("$destroy", function () {
        if (animationPromise) {
          $interval.cancel(animationPromise);
        }
      });

      // Format steps for display
      $scope.getStepDescription = function (step, index) {
        return (
          "Step " +
          index +
          ": State q" +
          step.state +
          " → Symbol: " +
          step.symbol
        );
      };

      // Get result class for styling
      $scope.getResultClass = function () {
        if (!$scope.result) return "";
        return $scope.result.accepted ? "success" : "danger";
      };

      // Get result message
      $scope.getResultMessage = function () {
        if (!$scope.result) return "";
        return $scope.result.accepted ? "ACCEPTED" : "REJECTED";
      };

      loadAutomata();
    },
  );

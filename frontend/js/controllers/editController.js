angular
  .module("automataApp")
  .controller(
    "EditController",
    function ($scope, $routeParams, $location, AutomataService, AuthService) {
      if (!AuthService.isAuthenticated()) {
        $location.path("/login");
        return;
      }

      $scope.automata = {};
      $scope.loading = true;
      $scope.error = null;
      $scope.success = null;

      $scope.stateInput = "";
      $scope.symbolInput = "";
      $scope.transitionFrom = "";
      $scope.transitionTo = "";
      $scope.transitionSymbol = "";
      $scope.transitionStackSymbol = "";
      $scope.transitionPushSymbol = "";
      $scope.transitionWriteSymbol = "";
      $scope.transitionMove = "R";
      $scope.stackAlphabetInput = "";
      $scope.acceptStateMap = {}; // Map for accept state checkboxes

      $scope.types = ["DFA", "NFA", "PDA", "TURING"];

      // Graphical editor callbacks
      $scope.onStateAdded = function (state) {
        console.log("State added:", state);
      };

      $scope.onStateRemoved = function (stateId) {
        console.log("State removed:", stateId);
      };

      $scope.onTransitionAdded = function (transition) {
        console.log("Transition added:", transition);
      };

      $scope.onTransitionRemoved = function (transition) {
        console.log("Transition removed:", transition);
      };

      // Update accept states from checkboxes
      $scope.updateAcceptStates = function () {
        $scope.automata.acceptStates = Object.keys(
          $scope.acceptStateMap,
        ).filter((key) => $scope.acceptStateMap[key]);
      };

      $scope.handleTypeChange = function () {
        if ($scope.automata.type === "PDA") {
          if (!$scope.automata.stackAlphabet || $scope.automata.stackAlphabet.length === 0) {
            $scope.automata.stackAlphabet = ["Z"];
          }
          if (!$scope.automata.initialStackSymbol) {
            $scope.automata.initialStackSymbol = "Z";
          }
          $scope.stackAlphabetInput = ($scope.automata.stackAlphabet || []).join(", ");
        }

        if ($scope.automata.type === "TURING" && !$scope.automata.tape) {
          $scope.automata.tape = "_";
        }
      };

      // Watch automata states to update acceptStateMap
      $scope.$watch(
        "automata.states",
        function (newStates) {
          if (newStates) {
            newStates.forEach((state) => {
              const stateName = state.name || state.id || state;
              if ($scope.automata.acceptStates.includes(stateName)) {
                $scope.acceptStateMap[stateName] = true;
              }
            });
          }
        },
        true,
      );

      // Load automata
      AutomataService.getAutomataById($routeParams.id).then(
        function (response) {
          $scope.automata = response.data;
          $scope.stackAlphabetInput = ($scope.automata.stackAlphabet || []).join(", ");
          $scope.loading = false;
        },
        function (error) {
          $scope.error = "Failed to load automata: " + error.statusText;
          $scope.loading = false;
          console.error(error);
        },
      );

      // Add state to list
      $scope.addState = function () {
        const stateName = ($scope.stateInput || "").trim();
        const exists = $scope.automata.states.some(
          (s) => (s.name || s.id || s) === stateName,
        );

        if (stateName && !exists) {
          $scope.automata.states.push({ id: stateName, name: stateName });
          $scope.stateInput = "";
        } else if (exists) {
          $scope.error = "State already exists";
        }
      };

      // Remove state
      $scope.removeState = function (state) {
        const stateName = state.name || state.id || state;
        $scope.automata.states = $scope.automata.states.filter(
          (s) => (s.name || s.id || s) !== stateName,
        );
      };

      // Add symbol to alphabet
      $scope.addSymbol = function () {
        if (
          $scope.symbolInput &&
          !$scope.automata.alphabet.includes($scope.symbolInput)
        ) {
          $scope.automata.alphabet.push($scope.symbolInput);
          $scope.symbolInput = "";
        }
      };

      // Remove symbol
      $scope.removeSymbol = function (symbol) {
        $scope.automata.alphabet = $scope.automata.alphabet.filter(
          (s) => s !== symbol,
        );
      };

      // Add transition
      $scope.addTransition = function () {
        if (
          !$scope.transitionFrom ||
          !$scope.transitionTo ||
          !$scope.transitionSymbol
        ) {
          $scope.error = "All transition fields are required";
          return;
        }

        const transition = {
          from: $scope.transitionFrom,
          to: $scope.transitionTo,
          symbol: $scope.transitionSymbol,
        };

        if ($scope.automata.type === "PDA") {
          transition.stackSymbol = $scope.transitionStackSymbol || null;
          transition.pushSymbol = $scope.transitionPushSymbol || null;
        }

        if ($scope.automata.type === "TURING") {
          transition.writeSymbol = $scope.transitionWriteSymbol || null;
          transition.move = $scope.transitionMove || "R";
        }

        $scope.automata.transitions.push(transition);
        $scope.transitionFrom = "";
        $scope.transitionTo = "";
        $scope.transitionSymbol = "";
        $scope.transitionStackSymbol = "";
        $scope.transitionPushSymbol = "";
        $scope.transitionWriteSymbol = "";
        $scope.transitionMove = "R";
        $scope.error = null;
      };

      // Remove transition
      $scope.removeTransition = function (index) {
        $scope.automata.transitions.splice(index, 1);
      };

      // Toggle accept state
      $scope.toggleAcceptState = function (state) {
        const stateName = state.name || state.id || state;

        if ($scope.automata.acceptStates.includes(stateName)) {
          $scope.automata.acceptStates = $scope.automata.acceptStates.filter(
            (s) => s !== stateName,
          );
        } else {
          $scope.automata.acceptStates.push(stateName);
        }
      };

      // Check if state is accept state
      $scope.isAcceptState = function (state) {
        return $scope.automata.acceptStates.includes(state);
      };

      // Update automata
      $scope.updateAutomata = function () {
        $scope.error = null;
        $scope.success = null;

        const dataToSave = angular.copy($scope.automata);

        if (dataToSave.type === "PDA") {
          const parsedStackAlphabet = String($scope.stackAlphabetInput || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

          dataToSave.stackAlphabet =
            parsedStackAlphabet.length > 0 ? parsedStackAlphabet : ["Z"];
          dataToSave.initialStackSymbol = dataToSave.initialStackSymbol || "Z";
        }

        if (dataToSave.type === "TURING") {
          dataToSave.tape = dataToSave.tape || "_";
        }

        AutomataService.updateAutomata($routeParams.id, dataToSave).then(
          function (response) {
            $scope.success = "Automata updated successfully!";
            setTimeout(function () {
              $location.path("/");
            }, 1500);
          },
          function (error) {
            $scope.error = "Error updating automata: " + error.statusText;
            console.error(error);
          },
        );
      };

      //Expose submit handler for shared form
      $scope.submitAutomata = $scope.updateAutomata;
      $scope.submitLabel = "Update Automata";

      // Cancel
      $scope.cancel = function () {
        $location.path("/");
      };
    },
  );

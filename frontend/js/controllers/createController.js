angular.module('automataApp').controller('CreateController', function($scope, $location, AutomataService) {
  $scope.automata = {
    name: '',
    type: 'DFA',
    states: [
      { id: 'q0', name: 'q0' }
    ],
    alphabet: ['0', '1'],
    initialState: 'q0',
    acceptStates: ['q0'],
    transitions: [],
    description: '',
  };

  $scope.stateInput = '';
  $scope.symbolInput = '';
  $scope.transitionFrom = '';
  $scope.transitionTo = '';
  $scope.transitionSymbol = '';
  $scope.acceptStateMap = {}; // Map for accept state checkboxes

  $scope.types = ['DFA', 'NFA', 'PDA', 'TURING'];
  $scope.error = null;
  $scope.success = null;

  // Graphical editor callbacks
  $scope.onStateAdded = function(state) {
    console.log('State added:', state);
  };

  $scope.onStateRemoved = function(stateId) {
    console.log('State removed:', stateId);
  };

  $scope.onTransitionAdded = function(transition) {
    console.log('Transition added:', transition);
  };

  $scope.onTransitionRemoved = function(transition) {
    console.log('Transition removed:', transition);
  };

  // Update accept states from checkboxes
  $scope.updateAcceptStates = function() {
    $scope.automata.acceptStates = Object.keys($scope.acceptStateMap).filter(key => $scope.acceptStateMap[key]);
  };

  // Watch automata states to update acceptStateMap
  $scope.$watch('automata.states', function(newStates) {
    if (newStates) {
      newStates.forEach(state => {
        const stateName = state.name || state.id;
        if ($scope.automata.acceptStates.includes(stateName)) {
          $scope.acceptStateMap[stateName] = true;
        }
      });
    }
  }, true);

  // Add state to list
  $scope.addState = function() {
    if ($scope.stateInput && !$scope.automata.states.includes($scope.stateInput)) {
      $scope.automata.states.push($scope.stateInput);
      $scope.stateInput = '';
    } else if ($scope.automata.states.includes($scope.stateInput)) {
      $scope.error = 'State already exists';
    }
  };

  // Remove state
  $scope.removeState = function(state) {
    $scope.automata.states = $scope.automata.states.filter(s => s !== state);
  };

  // Add symbol to alphabet
  $scope.addSymbol = function() {
    if ($scope.symbolInput && !$scope.automata.alphabet.includes($scope.symbolInput)) {
      $scope.automata.alphabet.push($scope.symbolInput);
      $scope.symbolInput = '';
    } else if ($scope.automata.alphabet.includes($scope.symbolInput)) {
      $scope.error = 'Symbol already exists';
    }
  };

  // Remove symbol
  $scope.removeSymbol = function(symbol) {
    $scope.automata.alphabet = $scope.automata.alphabet.filter(s => s !== symbol);
  };

  // Add transition
  $scope.addTransition = function() {
    if (!$scope.transitionFrom || !$scope.transitionTo || !$scope.transitionSymbol) {
      $scope.error = 'All transition fields are required';
      return;
    }

    const transition = {
      from: $scope.transitionFrom,
      to: $scope.transitionTo,
      symbol: $scope.transitionSymbol,
    };

    $scope.automata.transitions.push(transition);
    $scope.transitionFrom = '';
    $scope.transitionTo = '';
    $scope.transitionSymbol = '';
    $scope.error = null;
  };

  // Remove transition
  $scope.removeTransition = function(index) {
    $scope.automata.transitions.splice(index, 1);
  };

  // Add accept state
  $scope.toggleAcceptState = function(state) {
    if ($scope.automata.acceptStates.includes(state)) {
      $scope.automata.acceptStates = $scope.automata.acceptStates.filter(s => s !== state);
    } else {
      $scope.automata.acceptStates.push(state);
    }
  };

  // Check if state is accept state
  $scope.isAcceptState = function(state) {
    return $scope.automata.acceptStates.includes(state);
  };

  // Save automata
  $scope.saveAutomata = function() {
    $scope.error = null;
    $scope.success = null;

    if (!$scope.automata.name) {
      $scope.error = 'Name is required';
      return;
    }

    if ($scope.automata.states.length === 0) {
      $scope.error = 'At least one state is required';
      return;
    }

    if ($scope.automata.alphabet.length === 0) {
      $scope.error = 'At least one symbol is required';
      return;
    }

    if (!$scope.automata.initialState) {
      $scope.error = 'Initial state is required';
      return;
    }

    if ($scope.automata.acceptStates.length === 0) {
      $scope.error = 'At least one accept state is required';
      return;
    }

    // Prepare automata data for backend
    const dataToSave = angular.copy($scope.automata);

    AutomataService.createAutomata(dataToSave).then(
      function(response) {
        $scope.success = 'Automata created successfully!';
        setTimeout(function() {
          $location.path('/');
        }, 1500);
      },
      function(error) {
        $scope.error = 'Error creating automata: ' + error.statusText;
        console.error(error);
      }
    );
  };

  // Cancel
  $scope.cancel = function() {
    $location.path('/');
  };
});

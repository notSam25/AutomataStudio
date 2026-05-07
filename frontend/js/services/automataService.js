angular.module('automataApp').factory('AutomataService', function($http) {
  const API_BASE = 'http://localhost:5000/api';

  return {
    getAllAutomata: function() {
      return $http.get(API_BASE + '/automata');
    },

    getAutomataById: function(id) {
      return $http.get(API_BASE + '/automata/' + id);
    },

    createAutomata: function(automata) {
      return $http.post(API_BASE + '/automata', automata);
    },

    updateAutomata: function(id, automata) {
      return $http.put(API_BASE + '/automata/' + id, automata);
    },

    deleteAutomata: function(id) {
      return $http.delete(API_BASE + '/automata/' + id);
    },

    simulateAutomata: function(automataId, input) {
      return $http.post(API_BASE + '/simulate', {
        automataId: automataId,
        input: input,
      });
    },

    getSimulationHistory: function(automataId) {
      return $http.get(API_BASE + '/simulations/' + automataId);
    },

    getSimulationResult: function(id) {
      return $http.get(API_BASE + '/simulations/result/' + id);
    },
  };
});

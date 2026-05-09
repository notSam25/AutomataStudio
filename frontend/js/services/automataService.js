angular.module("automataApp").factory("AutomataService", function ($http, AuthService) {
  const API_BASE = "http://localhost:5000/api";

  const withAuth = function () {
    return {
      headers: AuthService.authHeaders(),
    };
  };

  return {
    getAllAutomata: function () {
      return $http.get(API_BASE + "/automata", withAuth());
    },

    getAutomataById: function (id) {
      return $http.get(API_BASE + "/automata/" + id, withAuth());
    },

    getAutomataByShareId: function (shareId) {
      return $http.get(API_BASE + "/share/" + shareId);
    },

    createAutomata: function (automata) {
      return $http.post(API_BASE + "/automata", automata, withAuth());
    },

    updateAutomata: function (id, automata) {
      return $http.put(API_BASE + "/automata/" + id, automata, withAuth());
    },

    deleteAutomata: function (id) {
      return $http.delete(API_BASE + "/automata/" + id, withAuth());
    },

    createShareLink: function (id) {
      return $http.post(API_BASE + "/automata/" + id + "/share", {}, withAuth());
    },

    revokeShareLink: function (id) {
      return $http.delete(API_BASE + "/automata/" + id + "/share", withAuth());
    },

    getExportUrl: function (id) {
      return API_BASE + "/automata/" + id + "/export";
    },

    simulateAutomata: function (automataId, input) {
      return $http.post(API_BASE + "/simulate", {
        automataId: automataId,
        input: input,
      }, withAuth());
    },

    getSimulationHistory: function (automataId) {
      return $http.get(API_BASE + "/simulations/" + automataId, withAuth());
    },

    getSimulationResult: function (id) {
      return $http.get(API_BASE + "/simulations/result/" + id, withAuth());
    },
  };
});

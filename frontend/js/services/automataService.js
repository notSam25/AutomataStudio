angular
  .module("automataApp")
  .factory("AutomataService", function ($http, AuthService) {
    const API_BASE =
      window && window.__API_BASE__
        ? window.__API_BASE__
        : "https://automata-studio-iota.vercel.app/api";

    const waitForWarmup = function () {
      if (window && window.__API_WARMUP_PROMISE__) {
        return window.__API_WARMUP_PROMISE__;
      }

      return Promise.resolve();
    };

    const requestAfterWarmup = function (requestFactory) {
      return waitForWarmup().then(function () {
        return requestFactory();
      });
    };

    const withAuth = function () {
      return {
        headers: AuthService.authHeaders(),
      };
    };

    return {
      getAllAutomata: function () {
        return requestAfterWarmup(function () {
          return $http.get(API_BASE + "/automata", withAuth());
        });
      },

      getAutomataById: function (id) {
        return requestAfterWarmup(function () {
          return $http.get(API_BASE + "/automata/" + id, withAuth());
        });
      },

      getAutomataByShareId: function (shareId) {
        return requestAfterWarmup(function () {
          return $http.get(API_BASE + "/share/" + shareId);
        });
      },

      createAutomata: function (automata) {
        return requestAfterWarmup(function () {
          return $http.post(API_BASE + "/automata", automata, withAuth());
        });
      },

      updateAutomata: function (id, automata) {
        return requestAfterWarmup(function () {
          return $http.put(API_BASE + "/automata/" + id, automata, withAuth());
        });
      },

      deleteAutomata: function (id) {
        return requestAfterWarmup(function () {
          return $http.delete(API_BASE + "/automata/" + id, withAuth());
        });
      },

      createShareLink: function (id) {
        return requestAfterWarmup(function () {
          return $http.post(
            API_BASE + "/automata/" + id + "/share",
            {},
            withAuth(),
          );
        });
      },

      revokeShareLink: function (id) {
        return requestAfterWarmup(function () {
          return $http.delete(
            API_BASE + "/automata/" + id + "/share",
            withAuth(),
          );
        });
      },

      getExportUrl: function (id) {
        return API_BASE + "/automata/" + id + "/export";
      },

      simulateAutomata: function (automataId, input) {
        return requestAfterWarmup(function () {
          return $http.post(
            API_BASE + "/simulate",
            {
              automataId: automataId,
              input: input,
            },
            withAuth(),
          );
        });
      },

      getSimulationHistory: function (automataId) {
        return requestAfterWarmup(function () {
          return $http.get(API_BASE + "/simulations/" + automataId, withAuth());
        });
      },

      getSimulationResult: function (id) {
        return requestAfterWarmup(function () {
          return $http.get(API_BASE + "/simulations/result/" + id, withAuth());
        });
      },
    };
  });

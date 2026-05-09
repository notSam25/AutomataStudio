angular.module("automataApp").factory("AuthService", function ($http, $window) {
  const API_BASE =
    window && window.__API_BASE__
      ? window.__API_BASE__
      : "http://localhost:5000/api";
  const TOKEN_KEY = "automata_auth_token";
  const USER_KEY = "automata_current_user";

  const getToken = function () {
    return $window.localStorage.getItem(TOKEN_KEY);
  };

  const setSession = function (token, user) {
    if (token) {
      $window.localStorage.setItem(TOKEN_KEY, token);
    }

    if (user) {
      $window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  };

  const clearSession = function () {
    $window.localStorage.removeItem(TOKEN_KEY);
    $window.localStorage.removeItem(USER_KEY);
  };

  const authHeaders = function () {
    const token = getToken();
    if (!token) {
      return {};
    }

    return {
      Authorization: "Bearer " + token,
    };
  };

  return {
    getToken: getToken,

    isAuthenticated: function () {
      return !!getToken();
    },

    getCurrentUser: function () {
      const raw = $window.localStorage.getItem(USER_KEY);
      if (!raw) {
        return null;
      }

      try {
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    },

    register: function (payload) {
      return $http
        .post(API_BASE + "/auth/register", payload, {
          headers: { "Content-Type": "application/json" },
        })
        .then(function (response) {
          setSession(response.data.token, response.data.user);
          return response;
        });
    },

    login: function (payload) {
      return $http
        .post(API_BASE + "/auth/login", payload, {
          headers: { "Content-Type": "application/json" },
        })
        .then(function (response) {
          setSession(response.data.token, response.data.user);
          return response;
        });
    },

    fetchMe: function () {
      return $http
        .get(API_BASE + "/auth/me", {
          headers: authHeaders(),
        })
        .then(function (response) {
          setSession(getToken(), response.data.user);
          return response;
        });
    },

    updateProfile: function (payload) {
      return $http
        .put(API_BASE + "/auth/me", payload, {
          headers: authHeaders(),
        })
        .then(function (response) {
          setSession(getToken(), response.data.user);
          return response;
        });
    },

    logout: function () {
      const token = getToken();
      if (!token) {
        clearSession();
        return Promise.resolve();
      }

      return $http
        .post(
          API_BASE + "/auth/logout",
          {},
          {
            headers: authHeaders(),
          },
        )
        .finally(function () {
          clearSession();
        });
    },

    authHeaders: authHeaders,
  };
});

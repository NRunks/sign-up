angular
	.module('app')
	.service('authService', ['$state', '$q', '$http', '$timeout', '$log', function ($state, $q, $http, $timeout, $log) {
		var login = function (email) {
			localStorage.setItem('auth_email', email);
			// Set the time that the auth will expire at
			var expiresAt = JSON.stringify((3600 * 1000) + new Date().getTime());
			localStorage.setItem('auth_expires_at', expiresAt);
		}

		var logout = function () {
			localStorage.removeItem('auth_email');
			localStorage.removeItem('auth_expires_at');
		}

		var isAuthenticated = function () {
			var isValid = false;
			var expiration = localStorage.getItem('auth_expires_at');
			if (localStorage.getItem('auth_email') && expiration) {
				isValid = (new Date().getTime() < expiration);
			}
			return isValid;
		}

		return {
			login: login,
			logout: logout,
			isAuthenticated: isAuthenticated
		}
	}
])


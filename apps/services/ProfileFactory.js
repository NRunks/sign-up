angular
		.module('app')
		.factory('ProfileFactory', ['$http', '$q', '$log', function ($http, $q, $log) {
		var getProfile = function (email) {
			$log.log('Getting profile for email' + email + '...');
			var defer = $q.defer();
			$http({ // Performed if there is no cached api token.
				url: '/signup-profile-api/get-profile',
				method: 'GET',
				params: {
					email: email
				}
			}).then(function success(response) {
				defer.resolve(response);
			}, function error(err) {
				defer.reject(err);
			});
			return defer.promise;
		}

		var registerProfile = function (email) {
			$log.log('Registering profile for email' + email + '...');
			var defer = $q.defer();
			$http({ // Performed if there is no cached api token.
				url: '/signup-profile-api/register-profile',
				method: 'POST',
				data: {
					email: email
				}
			}).then(function success(response) {
				defer.resolve(response);
			}, function error(err) {
				// this function will be called when the request returned error status
				console.log('Unable to register profile.');
				defer.reject(err);
			});
			return defer.promise;
		}

		var checkAvailability = function (email) {
			$log.log('Checking availability for email ' + email + '...');
			var defer = $q.defer();
			$http({ // Performed if there is no cached api token.
				url: '/signup-profile-api/check-availability',
				method: 'POST',
				data: {
					email: email
				}
			}).then(function success(response) {
				defer.resolve(response);
			}, function error(err) {
				defer.reject(err);
			});
			return defer.promise;
		}

		var checkCredentials = function (email) {
			$log.log('Checking credentials for email' + email + '...');
			var defer = $q.defer();
			$http({ // Performed if there is no cached api token.
				url: '/signup-profile-api/check-credentials',
				method: 'POST',
				data: {
					email: email
				}
			}).then(function success(response) {
				defer.resolve(response);
			}, function error(err) {
				defer.reject(err);
			});
			return defer.promise;
		}

		var saveProfile = function (uid, profile) {
			$log.log('Saving profile...');
			var defer = $q.defer();
			$http({ // Performed if there is no cached api token.
				url: '/signup-profile-api/save-profile',
				method: 'PATCH',
				data: {
					uid: uid,
					profile: profile
				}
			}).then(function success(response) {
				defer.resolve(response);
			}, function error(err) {
				defer.reject(err);
			});
			return defer.promise;
		}

		var deleteProfile = function (email) {
			$log.log('Deleting profile...');
			var defer = $q.defer();
			$http({ // Performed if there is no cached api token.
				url: '/signup-profile-api/delete-profile',
				method: 'DELETE',
				params: {
					email: email
				}
			}).then(function success(response) {
				defer.resolve(response);
			}, function error(err) {
				defer.reject(err);
			});
			return defer.promise;
		}


		return {
			getProfile: getProfile,
			registerProfile: registerProfile,
			checkAvailability: checkAvailability,
			checkCredentials: checkCredentials,
			saveProfile: saveProfile,
			deleteProfile: deleteProfile
		};
	}
])

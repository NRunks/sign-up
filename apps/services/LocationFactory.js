angular
	.module('app')
	.factory('LocationFactory', ['$http', '$q', '$log', function ($http, $q, $log) {
		var getCoordinates = function (countryCode, city, stateOrProvince) {
			console.log("verifying location...");
			var location = [];

			$http.defaults.headers.common['Content-Type'] = 'application/json';
			var defer = $q.defer();
			$http({
				url: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates',
				method: 'GET',
				params: {
					countryCode: countryCode,
					city: city,
					region: stateOrProvince,
					f: 'json'
				},
				headers: {
					'Authorization': undefined
				},
				paramSerializer: '$httpParamSerializerJQLike'
			}).then(function success(response) {
				defer.resolve(response.data);
			}, function error(response) {
				// this function will be called when the request returned error status
				$log.error("Failed to get geocoded result...");
				defer.reject(null);
			});
			return defer.promise;
		}

		return {
			getCoordinates: getCoordinates
		};
	}
])

angular
	.module('app')
	.factory('MediaFactory', ['$http', '$q', '$log', function ($http, $q, $log) {
		var security = {};
		var resizeThumbnailAndSave = function (imageUrl, mimeType) {
			return $http({
				url: '/resize-thumbnail-and-save',
				method: 'POST',
				data: {
					'imageUrl': imageUrl,
					'mimeType': mimeType
				}
			}).then(function success(response) {
				$log.log("Image resized ok.");
				return response.data;
			}, function error(response) {
				$log.error("Error resizing image.");
				return response;
			});
		}

		var getNews = function () {
			var defer = $q.defer();
			$http({
				url: '/get-news',
				method: 'GET'
			}).then(function success(response) {
				$log.log("Articles retrieved ok.");
				defer.resolve(response.data);
			}, function error(response) {
				$log.error("Error fetching articles.");
				defer.reject(response.data);
			});
			return defer.promise;
		}

		var getPhotos = function () {
			var defer = $q.defer();
			$http({
				url: '/get-photos',
				method: 'GET'
			}).then(function success(response) {
				$log.log("Photos retrieved ok.");
				defer.resolve(response.data);
			}, function error(response) {
				$log.error("Error fetching photos.");
				defer.reject(response.data);
			});
			return defer.promise;
		}

		var getAlbum = function(album) {
			var defer = $q.defer();
			$http({
				url: '/get-album',
				method: 'GET',
				params: {
					'album': album
				}
			}).then(function success(response) {
				$log.log("Album Info retrieved ok.");
				defer.resolve(response.data);
			}, function error(response) {
				$log.error("Error fetching album: %s", album);
				defer.reject(response.data);
			});
			return defer.promise;
		}

		var getQuote = function() {
			var defer = $q.defer();
			$http({
				url: '/get-quote',
				method: 'GET'
			}).then(function success(response) {
				$log.log("Quote retrieved ok.");
				defer.resolve(response.data);
			}, function error(response) {
				$log.error("Error fetching quote");
				defer.reject(response.data);
			});
			return defer.promise;
		}

		var getCommunityMembers = function () {
			var defer = $q.defer();
			$http({
				url: '/get-community-members',
				method: 'GET'
			}).then(function success(response) {
				$log.log("Community members retrieved ok.");
				defer.resolve(response.data);
			}, function error(response) {
				$log.error("Error fetching community members.");
				defer.reject(response.data);
			});
			return defer.promise;
		}

		return {
			resizeThumbnailAndSave: resizeThumbnailAndSave,
			getCommunityMembers: getCommunityMembers,
			getNews: getNews,
			getPhotos: getPhotos,
			getAlbum: getAlbum,
			getQuote: getQuote
		}
	}
])

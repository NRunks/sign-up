var app = angular
	.module('app', ['ui.router', 'ngAnimate', 'ngAria', 'ngMessages', 'ngResource', 'ngSanitize', 'ngMaterial', 'cl.paging']);

app.config([
	'$stateProvider', '$locationProvider', '$urlRouterProvider', '$resourceProvider',
	'$mdThemingProvider', '$sceDelegateProvider', '$compileProvider',
	function ($stateProvider, $locationProvider, $urlRouterProvider, $resourceProvider,
		$mdThemingProvider, $sceDelegateProvider, $compileProvider) {

		$stateProvider
			.state('home', {
				abstract: true
			})
			.state('home.login', {
				url: '/login',
				templateUrl: './apps/views/login.html',
				controller: 'LoginController',
				controllerAs: 'vm'
			})
			.state('home.register', {
				url: '/register',
				templateUrl: './apps/views/register.html',
				controller: 'RegisterController',
				controllerAs: 'vm',
				resolve: {
					UserProfile: ["ProfileFactory", "authService", "$state", function (ProfileFactory, authService, $state) {
						if (authService.isAuthenticated()) {
							return ProfileFactory.getProfile(localStorage.getItem('auth_email')).then(function (result) {
								console.log(result.data);
								return result.data;
							}, function (err) {
								return null;
							})
						} else {
							$state.go('home.login');
						}
					}],
					FilePermissions: ["SecurityFactory", "$http", "$q", "$log", function (SecurityFactory, $http, $q, $log) {
						$log.log('Getting permissions...');
						var defer = $q.defer();
						$http({ // Performed if there is no cached api token.
							url: '/policy',
							method: 'GET'
						}).then(function success(response) {
							SecurityFactory.setSecurity(response.data.policy, response.data.signature);
							defer.resolve(response.data);
						}, function error(err) {
							console.log(err);
							defer.reject(null);
						});
						return defer.promise;
					}]
				}
			})
			.state('home.main', {
				abstract: true,
				templateUrl: './apps/views/main-toolbar.html',
				controller: 'HomeController',
				controllerAs: 'vm',
				resolve: {
					UserProfile: ["ProfileFactory", "authService", "$state", function (ProfileFactory, authService, $state) {
						if (authService.isAuthenticated()) {
							return ProfileFactory.getProfile(localStorage.getItem('auth_email'), localStorage.getItem('auth_pwd')).then(function (result) {
								console.log(result.data)
								return result.data;
							}, function (err) {
								$state.go('home.login');
							})
						} else {
							$state.go('home.login');
						}
					}],
					FilePermissions: ["SecurityFactory", "$http", "$q", "$log", function (SecurityFactory, $http, $q, $log) {
						$log.log('Getting permissions...');
						var defer = $q.defer();
						$http({ // Performed if there is no cached api token.
							url: '/policy',
							method: 'GET'
						}).then(function success(response) {
							SecurityFactory.setSecurity(response.data.policy, response.data.signature);
							defer.resolve(response.data);
						}, function error(err) {
							console.log(err);
							defer.reject(null);
						});
						return defer.promise;
					}]
				}
			})
			.state('home.main.profile', {
				url: '/profile',
				templateUrl: './apps/views/profile.html',
				controller: 'ProfileController',
				controllerAs: 'vm'
			})
			.state('home.main.feed', {
				url: '/home',
				templateUrl: './apps/views/feed.html',
				controller: 'FeedController',
				controllerAs: 'vm'
			})
			.state('home.main.messages', {
				controller: 'MessagesController',
				templateUrl: './apps/views/messages.html'
			})
			.state('home.main.messages.main', {
				url: '/messages',
				templateUrl: './apps/views/message-content.html'

			})
			.state('home.main.community', {
				url: '/my-community',
				templateUrl: './apps/views/community.html',
				controller: 'CommunityController',
				controllerAs: 'vm'
			});

		$urlRouterProvider.otherwise(function ($injector, $location) {
			$location.path('/login');
		});

		$locationProvider.hashPrefix('');

		/// Comment out the line below to run the app
		// without HTML5 mode (will use hashes in routes)
		$locationProvider.html5Mode(true);


		$mdThemingProvider.theme('default')
			.primaryPalette('pink', {
				'default': '400',
				'hue-1': '100',
				'hue-2': '400',
				'hue-3': '600'
			});


		$mdThemingProvider.theme('default')
			.accentPalette('purple', {
				'default': '400', // use shade 200 for default, and keep all other shades the same
				'hue-1': '100',
				'hue-2': '600',
				'hue-3': 'A100'
			});

			$mdThemingProvider.theme('default-inverse')
			.primaryPalette('purple', {
				'default': '400',
				'hue-1': '100',
				'hue-2': '400',
				'hue-3': '600'
			});


		$mdThemingProvider.theme('default-inverse')
			.accentPalette('pink', {
				'default': '400', // use shade 200 for default, and keep all other shades the same
				'hue-1': '100',
				'hue-2': '600',
				'hue-3': 'A100'
			});


		$mdThemingProvider.theme('form-docs', 'default')
			.primaryPalette('yellow');

		$mdThemingProvider.enableBrowserColor({
			theme: 'default', // Default is 'default'
			palette: 'accent', // Default is 'primary', any basic material palette and extended palettes are available
			hue: 'A100' // Default is '800'
		});

		$sceDelegateProvider.resourceUrlWhitelist([
			// Allow same origin resource loads.
			'self',
			// Allow loading from our assets domain.  Notice the difference between * and **.
			'http://gd.geobytes.com/**',
			'http://geocode.arcgis.com/arcgis/rest/**'
		]);

		$compileProvider.debugInfoEnabled(false);
	}])

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

angular
	.module('app')
	.factory('SecurityFactory', [function () {
		var security = {};
		var setSecurity = function (policy, signature) {
			return security = {
				policy: policy,
				signature: signature
			};
		}

		var getSecurity = function () {
			return security;
		}
		return {
			setSecurity: setSecurity,
			getSecurity: getSecurity
		}
	}
]);

angular
    .module('app')
    .controller('CommunityController', ['authService', 'UserProfile', 'ProfileFactory',
        'MediaFactory', '$scope', '$http', '$timeout', '$mdToast',
        function (authService, UserProfile, ProfileFactory, MediaFactory,
            $scope, $http, $timeout, $mdToast) {

            var vm = this;
            vm.auth = authService;
            vm.user = UserProfile;
            $scope.$parent.currentNavItem = "community";

            vm.targetEmail = vm.user.email;

            vm.communityMembers = [];
            vm.currentPage = 0;
            vm.currentMembers = [];
            vm.isLoadingCommunity = true;

            $scope.paging = {
                total: 40,
                current: 1,
                onPageChanged: loadPages,
            };

            vm.professions = undefined;

            function loadPages() {

                // TODO : Load current page Data here
                vm.currentPage = $scope.paging.current;
                if (vm.communityMembers && vm.communityMembers.length > 0) {

                    var begin = ((vm.currentPage - 1) * 48)
                        , end = begin + 48;

                    vm.currentMembers = vm.communityMembers.slice(begin, end);
                }
            }

            MediaFactory.getCommunityMembers().then(function (community) {
                vm.communityMembers = community.results;
                $scope.paging.total = community.info.results / 48 
                loadPages();
                vm.isLoadingCommunity = false;
            }, function (err) {
                vm.isLoadingCommunity = false;
                $mdToast.show(
                    $mdToast.simple()
                        .textContent('Unable to retrieve your community... Please try again later.')
                        .action('OK')
                        .highlightAction(true)
                        .highlightClass('md-accent') // Accent is used by default, this just demonstrates the usage.
                        .parent(document.querySelectorAll('#app-container'))
                        .position('bottom right'));
            });

            $scope.getName = function(communityMember) {
                return communityMember.name.first + " " + communityMember.name.last;
            }

            $http.get('./apps/json/listings.json').then(function (json) {
				if (json) {
	
					json.data.push({
						id: json.data.length + 1,
						text: 'Other',
						icon: ""
                    });

                    vm.professions = [];
                    for (var i = 0; i < 48 * 3; i++) {
                        vm.professions[i] = json.data[getRandomProfessionIndex(json.data)].text;
                    }

				} else {
				}
			}, function (err) {
            });

            function getRandomProfessionIndex (dataset) {
                return Math.floor(Math.random() * dataset.length)
            }
        }
    ])
angular
    .module('app')
    .controller('FeedController', ['authService', 'UserProfile', 'ProfileFactory',
        'SecurityFactory', 'MediaFactory', '$state', '$http', '$window', '$scope', '$q', '$timeout', '$mdToast', '$log',
        function (authService, UserProfile, ProfileFactory, SecurityFactory, MediaFactory,
            $state, $http, $window, $scope, $q, $timeout, $mdToast, $log) {

            var vm = this;
            vm.auth = authService;
            vm.user = UserProfile;
            $scope.$parent.currentNavItem = "feed";

            $scope.albums = [];
            vm.quote1 = {
                text: '',
                author: ''
            };
            vm.quote2 = {
                text: '',
                author: ''
            };
            vm.photos1 = [];
            vm.photos2 = [];
            vm.album1 = null;
            vm.album2 = null;
            vm.photoCount1 = 6;
            vm.photoCount2 = 8;
            vm.article1 = null, vm.article2 = null, vm.article3 = null;
            vm.hasVideo = true;
            vm.isLoading = false;

            $http.get('./apps/json/artists.json').then(function (json) {
                if (json) {
                    $scope.albums = json.data.data;
                    var albumIndex1 = Math.floor(Math.random() * 31), albumIndex2 = Math.floor(Math.random() * 31);
                    while (albumIndex1 == albumIndex2) { // Make sure both indexes aren't identical
                        albumIndex2 = Math.floor(Math.random() * 31);
                    }
                    var album1 = MediaFactory.getAlbum($scope.albums[albumIndex1].album);
                    var album2 = MediaFactory.getAlbum($scope.albums[albumIndex2].album);

                    $q.all([album1, album2]).then(function (albums) {
                        vm.album1 = albums[0].results.albummatches.album[0];
                        vm.album2 = albums[1].results.albummatches.album[0];
                    }, function (err) {
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent('Error loading content on the page.')
                                .action('OK')
                                .highlightAction(true)
                                .highlightClass('md-accent') // Accent is used by default, this just demonstrates the usage.
                                .parent(document.querySelectorAll('#app-container'))
                                .position('bottom right'));
                    });
                } else {
                    $log.error('No artists available');
                }
            }, function (err) {
                $log.error("Unable to parse JSON for artists.")
            });

            var quote1 = MediaFactory.getQuote();
            var quote2 = null;
            $timeout(function () {
                quote2 = MediaFactory.getQuote();
                $q.all([quote1, quote2]).then(function (quotes) {
                    vm.quote1.text = quotes[0].quoteText;
                    vm.quote1.author = quotes[0].quoteAuthor;
                    vm.quote2.text = quotes[1].quoteText;
                    vm.quote2.author = quotes[1].quoteAuthor;
                }, function (err) {
                    $log.error(err);
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('Error loading content on the page.')
                            .action('OK')
                            .highlightAction(true)
                            .highlightClass('md-accent') // Accent is used by default, this just demonstrates the usage.
                            .parent(document.querySelectorAll('#app-container'))
                            .position('bottom right'));
                });
            }, 1000);

            MediaFactory.getNews().then(function (news) {
                var articleIndex1 = Math.floor(Math.random() * 20);
                var articleIndex2 = Math.floor(Math.random() * 20);
                var articleIndex3 = Math.floor(Math.random() * 20);

                //Below I make sure all of the indexes are unique
                while ((articleIndex2 == articleIndex1) || (articleIndex2 == articleIndex3)) {
                    articleIndex2 = Math.floor(Math.random() * 20);
                }

                while ((articleIndex3 == articleIndex1)) {
                    articleIndex3 = Math.floor(Math.random() * 20);
                }

                vm.article1 = news.articles[articleIndex1];
                vm.article2 = news.articles[articleIndex2];
                vm.article3 = news.articles[articleIndex3];
            }, function (err) {
                $log.error(err);
                $mdToast.show(
                    $mdToast.simple()
                        .textContent('Error loading content on the page.')
                        .action('OK')
                        .highlightAction(true)
                        .highlightClass('md-accent') // Accent is used by default, this just demonstrates the usage.
                        .parent(document.querySelectorAll('#app-container'))
                        .position('bottom right'));
            });

            var photoAlbum1 = MediaFactory.getPhotos();
            var photoAlbum2 = MediaFactory.getPhotos();
            $q.all([photoAlbum1, photoAlbum2]).then(function (photos) {
                for (i = 0; i < vm.photoCount1; i++) {
                    var temp = photos[0].photos.photo[Math.floor((Math.random() * 99) + 1)];
                    if (temp && angular.isDefined(temp.id)) {
                        var isDuplicate = false;
                        for (j = 0; j < vm.photos1.length; j++) {
                            if (temp.id == vm.photos1[j].id) {
                                isDuplicate = true;
                            }
                        }
                        if (!isDuplicate) {
                            vm.photos1[i] = temp;
                        }
                    }
                }
                for (i = 0; i < vm.photoCount2; i++) {
                    var temp = photos[1].photos.photo[Math.floor((Math.random() * 99) + 1)];
                    if (temp && angular.isDefined(temp.id)) {
                        var isDuplicate = false;
                        for (j = 0; j < vm.photos2.length; j++) {
                            if (temp.id == vm.photos2[j].id) {
                                isDuplicate = true;
                            }
                        }
                        if (!isDuplicate) {
                            vm.photos2[i] = temp;
                        }
                    }
                }
            }, function (err) {
                $log.error(err);
                $mdToast.show(
                    $mdToast.simple()
                        .textContent('Error loading content on the page.')
                        .action('OK')
                        .highlightAction(true)
                        .highlightClass('md-accent') // Accent is used by default, this just demonstrates the usage.
                        .parent(document.querySelectorAll('#app-container'))
                        .position('bottom right'));
            });

            vm.goTo = function (url) {
                window.open(url);
            }

            angular.element($window).bind("scroll", _.debounce(function () {
                var windowHeight = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
                var body = document.body, html = document.documentElement;
                var docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
                windowBottom = windowHeight + window.pageYOffset;
                if (windowBottom >= docHeight) {
                    //alert('bottom reached');
                    vm.isLoading = true;
                    $scope.$apply();
                    $timeout(function () {
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent('This is just a demo. There is no more content to show.')
                                .action('OK')
                                .highlightAction(true)
                                .highlightClass('md-accent') // Accent is used by default, this just demonstrates the usage.
                                .parent(document.querySelectorAll('#feed-load-container'))
                                .position('bottom right'));
                    }, 3000);
                    $timeout(function () {
                        vm.isLoading = false;
                    }, 9000);
                }
            }, 1500));
        }
    ])
angular
		.module('app')
		.controller('HomeController', ['authService', 'UserProfile', 'SecurityFactory',
		'ProfileFactory',  '$state', '$http', '$window', '$scope', '$timeout', '$mdToast', function HomeController(authService, UserProfile, SecurityFactory, ProfileFactory, $state, $http, $window, $scope, $timeout, $mdToast) {
		var vm = this;
		vm.user = UserProfile;
		vm.auth = authService;
		//$scope.currentNavItem = "profile";
		$scope.security = SecurityFactory.getSecurity();
		$scope.defaultThumbnail = {
			url: "Unknown",
			mimetype: "image/default"
		}
		
		$scope.defaultThumbnail = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaGVpZ2h0PSIxMDAiIGlkPSJzdmcyIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCA5OS45OTk5OTUgOTkuOTk5OTk1IiB3aWR0aD0iMTAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6aW5rc2NhcGU9Imh0dHA6Ly93d3cuaW5rc2NhcGUub3JnL25hbWVzcGFjZXMvaW5rc2NhcGUiIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIiB4bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcyBpZD0iZGVmczQiPjxmaWx0ZXIgaWQ9ImZpbHRlcjQ1MTAiIHN0eWxlPSJjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM6c1JHQiI+PGZlRmxvb2QgZmxvb2QtY29sb3I9InJnYigwLDAsMCkiIGZsb29kLW9wYWNpdHk9IjAuNDcwNTg4IiBpZD0iZmVGbG9vZDQ1MTIiIHJlc3VsdD0iZmxvb2QiLz48ZmVDb21wb3NpdGUgaWQ9ImZlQ29tcG9zaXRlNDUxNCIgaW49ImZsb29kIiBpbjI9IlNvdXJjZUdyYXBoaWMiIG9wZXJhdG9yPSJpbiIgcmVzdWx0PSJjb21wb3NpdGUxIi8+PGZlR2F1c3NpYW5CbHVyIGlkPSJmZUdhdXNzaWFuQmx1cjQ1MTYiIGluPSJjb21wb3NpdGUxIiByZXN1bHQ9ImJsdXIiIHN0ZERldmlhdGlvbj0iNSIvPjxmZU9mZnNldCBkeD0iMCIgZHk9IjQuNyIgaWQ9ImZlT2Zmc2V0NDUxOCIgcmVzdWx0PSJvZmZzZXQiLz48ZmVDb21wb3NpdGUgaWQ9ImZlQ29tcG9zaXRlNDUyMCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0ib2Zmc2V0IiBvcGVyYXRvcj0ib3ZlciIgcmVzdWx0PSJjb21wb3NpdGUyIi8+PC9maWx0ZXI+PGZpbHRlciBpZD0iZmlsdGVyNTA2NCIgc3R5bGU9ImNvbG9yLWludGVycG9sYXRpb24tZmlsdGVyczpzUkdCIj48ZmVGbG9vZCBmbG9vZC1jb2xvcj0icmdiKDIwNiwyNDIsMjQ1KSIgZmxvb2Qtb3BhY2l0eT0iMC44MzUyOTQiIGlkPSJmZUZsb29kNTA2NiIgcmVzdWx0PSJmbG9vZCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU1MDY4IiBpbj0iZmxvb2QiIGluMj0iU291cmNlR3JhcGhpYyIgb3BlcmF0b3I9Im91dCIgcmVzdWx0PSJjb21wb3NpdGUxIi8+PGZlR2F1c3NpYW5CbHVyIGlkPSJmZUdhdXNzaWFuQmx1cjUwNzAiIGluPSJjb21wb3NpdGUxIiByZXN1bHQ9ImJsdXIiIHN0ZERldmlhdGlvbj0iNS45Ii8+PGZlT2Zmc2V0IGR4PSIwIiBkeT0iLTguMSIgaWQ9ImZlT2Zmc2V0NTA3MiIgcmVzdWx0PSJvZmZzZXQiLz48ZmVDb21wb3NpdGUgaWQ9ImZlQ29tcG9zaXRlNTA3NCIgaW49Im9mZnNldCIgaW4yPSJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0iYXRvcCIgcmVzdWx0PSJjb21wb3NpdGUyIi8+PC9maWx0ZXI+PGZpbHRlciBpZD0iZmlsdGVyNTM2NCIgc3R5bGU9ImNvbG9yLWludGVycG9sYXRpb24tZmlsdGVyczpzUkdCIj48ZmVGbG9vZCBmbG9vZC1jb2xvcj0icmdiKDAsMCwwKSIgZmxvb2Qtb3BhY2l0eT0iMC44MzUyOTQiIGlkPSJmZUZsb29kNTM2NiIgcmVzdWx0PSJmbG9vZCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU1MzY4IiBpbj0iZmxvb2QiIGluMj0iU291cmNlR3JhcGhpYyIgb3BlcmF0b3I9ImluIiByZXN1bHQ9ImNvbXBvc2l0ZTEiLz48ZmVHYXVzc2lhbkJsdXIgaWQ9ImZlR2F1c3NpYW5CbHVyNTM3MCIgaW49ImNvbXBvc2l0ZTEiIHJlc3VsdD0iYmx1ciIgc3RkRGV2aWF0aW9uPSI1Ii8+PGZlT2Zmc2V0IGR4PSIwIiBkeT0iNC4yIiBpZD0iZmVPZmZzZXQ1MzcyIiByZXN1bHQ9Im9mZnNldCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU1Mzc0IiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJvZmZzZXQiIG9wZXJhdG9yPSJvdmVyIiByZXN1bHQ9ImZiU291cmNlR3JhcGhpYyIvPjxmZUNvbG9yTWF0cml4IGlkPSJmZUNvbG9yTWF0cml4NTU5MiIgaW49ImZiU291cmNlR3JhcGhpYyIgcmVzdWx0PSJmYlNvdXJjZUdyYXBoaWNBbHBoYSIgdmFsdWVzPSIwIDAgMCAtMSAwIDAgMCAwIC0xIDAgMCAwIDAgLTEgMCAwIDAgMCAxIDAiLz48ZmVGbG9vZCBmbG9vZC1jb2xvcj0icmdiKDI1NCwyNTUsMTg5KSIgZmxvb2Qtb3BhY2l0eT0iMSIgaWQ9ImZlRmxvb2Q1NTk0IiBpbj0iZmJTb3VyY2VHcmFwaGljIiByZXN1bHQ9ImZsb29kIi8+PGZlQ29tcG9zaXRlIGlkPSJmZUNvbXBvc2l0ZTU1OTYiIGluPSJmbG9vZCIgaW4yPSJmYlNvdXJjZUdyYXBoaWMiIG9wZXJhdG9yPSJvdXQiIHJlc3VsdD0iY29tcG9zaXRlMSIvPjxmZUdhdXNzaWFuQmx1ciBpZD0iZmVHYXVzc2lhbkJsdXI1NTk4IiBpbj0iY29tcG9zaXRlMSIgcmVzdWx0PSJibHVyIiBzdGREZXZpYXRpb249IjcuNiIvPjxmZU9mZnNldCBkeD0iMCIgZHk9Ii04LjEiIGlkPSJmZU9mZnNldDU2MDAiIHJlc3VsdD0ib2Zmc2V0Ii8+PGZlQ29tcG9zaXRlIGlkPSJmZUNvbXBvc2l0ZTU2MDIiIGluPSJvZmZzZXQiIGluMj0iZmJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0iYXRvcCIgcmVzdWx0PSJjb21wb3NpdGUyIi8+PC9maWx0ZXI+PGZpbHRlciBpZD0iZmlsdGVyNDQwMCIgc3R5bGU9ImNvbG9yLWludGVycG9sYXRpb24tZmlsdGVyczpzUkdCIj48ZmVGbG9vZCBmbG9vZC1jb2xvcj0icmdiKDAsMCwwKSIgZmxvb2Qtb3BhY2l0eT0iMC40NzA1ODgiIGlkPSJmZUZsb29kNDQwMiIgcmVzdWx0PSJmbG9vZCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU0NDA0IiBpbj0iZmxvb2QiIGluMj0iU291cmNlR3JhcGhpYyIgb3BlcmF0b3I9ImluIiByZXN1bHQ9ImNvbXBvc2l0ZTEiLz48ZmVHYXVzc2lhbkJsdXIgaWQ9ImZlR2F1c3NpYW5CbHVyNDQwNiIgaW49ImNvbXBvc2l0ZTEiIHJlc3VsdD0iYmx1ciIgc3RkRGV2aWF0aW9uPSI1Ii8+PGZlT2Zmc2V0IGR4PSIwIiBkeT0iNSIgaWQ9ImZlT2Zmc2V0NDQwOCIgcmVzdWx0PSJvZmZzZXQiLz48ZmVDb21wb3NpdGUgaWQ9ImZlQ29tcG9zaXRlNDQxMCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0ib2Zmc2V0IiBvcGVyYXRvcj0ib3ZlciIgcmVzdWx0PSJmYlNvdXJjZUdyYXBoaWMiLz48ZmVDb2xvck1hdHJpeCBpZD0iZmVDb2xvck1hdHJpeDQ2NDAiIGluPSJmYlNvdXJjZUdyYXBoaWMiIHJlc3VsdD0iZmJTb3VyY2VHcmFwaGljQWxwaGEiIHZhbHVlcz0iMCAwIDAgLTEgMCAwIDAgMCAtMSAwIDAgMCAwIC0xIDAgMCAwIDAgMSAwIi8+PGZlRmxvb2QgZmxvb2QtY29sb3I9InJnYigyNTUsMjUzLDE4MCkiIGZsb29kLW9wYWNpdHk9IjEiIGlkPSJmZUZsb29kNDY0MiIgaW49ImZiU291cmNlR3JhcGhpYyIgcmVzdWx0PSJmbG9vZCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU0NjQ0IiBpbj0iZmxvb2QiIGluMj0iZmJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0ib3V0IiByZXN1bHQ9ImNvbXBvc2l0ZTEiLz48ZmVHYXVzc2lhbkJsdXIgaWQ9ImZlR2F1c3NpYW5CbHVyNDY0NiIgaW49ImNvbXBvc2l0ZTEiIHJlc3VsdD0iYmx1ciIgc3RkRGV2aWF0aW9uPSI1Ii8+PGZlT2Zmc2V0IGR4PSIwIiBkeT0iLTUiIGlkPSJmZU9mZnNldDQ2NDgiIHJlc3VsdD0ib2Zmc2V0Ii8+PGZlQ29tcG9zaXRlIGlkPSJmZUNvbXBvc2l0ZTQ2NTAiIGluPSJvZmZzZXQiIGluMj0iZmJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0iYXRvcCIgcmVzdWx0PSJjb21wb3NpdGUyIi8+PC9maWx0ZXI+PGZpbHRlciBpZD0iZmlsdGVyNDY3OCIgc3R5bGU9ImNvbG9yLWludGVycG9sYXRpb24tZmlsdGVyczpzUkdCIj48ZmVGbG9vZCBmbG9vZC1jb2xvcj0icmdiKDI1NSwyNTMsMTgwKSIgZmxvb2Qtb3BhY2l0eT0iMSIgaWQ9ImZlRmxvb2Q0NjgwIiByZXN1bHQ9ImZsb29kIi8+PGZlQ29tcG9zaXRlIGlkPSJmZUNvbXBvc2l0ZTQ2ODIiIGluPSJmbG9vZCIgaW4yPSJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0ib3V0IiByZXN1bHQ9ImNvbXBvc2l0ZTEiLz48ZmVHYXVzc2lhbkJsdXIgaWQ9ImZlR2F1c3NpYW5CbHVyNDY4NCIgaW49ImNvbXBvc2l0ZTEiIHJlc3VsdD0iYmx1ciIgc3RkRGV2aWF0aW9uPSI1Ii8+PGZlT2Zmc2V0IGR4PSIwIiBkeT0iLTciIGlkPSJmZU9mZnNldDQ2ODYiIHJlc3VsdD0ib2Zmc2V0Ii8+PGZlQ29tcG9zaXRlIGlkPSJmZUNvbXBvc2l0ZTQ2ODgiIGluPSJvZmZzZXQiIGluMj0iU291cmNlR3JhcGhpYyIgb3BlcmF0b3I9ImF0b3AiIHJlc3VsdD0iY29tcG9zaXRlMiIvPjwvZmlsdGVyPjxmaWx0ZXIgaWQ9ImZpbHRlcjUwNDUiIHN0eWxlPSJjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM6c1JHQiI+PGZlRmxvb2QgZmxvb2QtY29sb3I9InJnYigyNTUsMjUwLDE3NSkiIGZsb29kLW9wYWNpdHk9IjEiIGlkPSJmZUZsb29kNTA0NyIgcmVzdWx0PSJmbG9vZCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU1MDQ5IiBpbj0iZmxvb2QiIGluMj0iU291cmNlR3JhcGhpYyIgb3BlcmF0b3I9Im91dCIgcmVzdWx0PSJjb21wb3NpdGUxIi8+PGZlR2F1c3NpYW5CbHVyIGlkPSJmZUdhdXNzaWFuQmx1cjUwNTEiIGluPSJjb21wb3NpdGUxIiByZXN1bHQ9ImJsdXIiIHN0ZERldmlhdGlvbj0iNSIvPjxmZU9mZnNldCBkeD0iMCIgZHk9Ii02IiBpZD0iZmVPZmZzZXQ1MDUzIiByZXN1bHQ9Im9mZnNldCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU1MDU1IiBpbj0ib2Zmc2V0IiBpbjI9IlNvdXJjZUdyYXBoaWMiIG9wZXJhdG9yPSJhdG9wIiByZXN1bHQ9ImNvbXBvc2l0ZTIiLz48L2ZpbHRlcj48ZmlsdGVyIGlkPSJmaWx0ZXI0NjA3IiBzdHlsZT0iY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzOnNSR0I7Ij48ZmVGbG9vZCBmbG9vZC1jb2xvcj0icmdiKDI1NSwyNDcsMTgwKSIgZmxvb2Qtb3BhY2l0eT0iMSIgaWQ9ImZlRmxvb2Q0NjA5IiByZXN1bHQ9ImZsb29kIi8+PGZlQ29tcG9zaXRlIGlkPSJmZUNvbXBvc2l0ZTQ2MTEiIGluPSJmbG9vZCIgaW4yPSJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0ib3V0IiByZXN1bHQ9ImNvbXBvc2l0ZTEiLz48ZmVHYXVzc2lhbkJsdXIgaWQ9ImZlR2F1c3NpYW5CbHVyNDYxMyIgaW49ImNvbXBvc2l0ZTEiIHJlc3VsdD0iYmx1ciIgc3RkRGV2aWF0aW9uPSI1Ii8+PGZlT2Zmc2V0IGR4PSIwIiBkeT0iLTYiIGlkPSJmZU9mZnNldDQ2MTUiIHJlc3VsdD0ib2Zmc2V0Ii8+PGZlQ29tcG9zaXRlIGlkPSJmZUNvbXBvc2l0ZTQ2MTciIGluPSJvZmZzZXQiIGluMj0iU291cmNlR3JhcGhpYyIgb3BlcmF0b3I9ImF0b3AiIHJlc3VsdD0iY29tcG9zaXRlMiIvPjwvZmlsdGVyPjxmaWx0ZXIgaWQ9ImZpbHRlcjQ1MDciIHN0eWxlPSJjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM6c1JHQjsiPjxmZUZsb29kIGZsb29kLWNvbG9yPSJyZ2IoMjU1LDI0OSwxOTkpIiBmbG9vZC1vcGFjaXR5PSIxIiBpZD0iZmVGbG9vZDQ1MDkiIHJlc3VsdD0iZmxvb2QiLz48ZmVDb21wb3NpdGUgaWQ9ImZlQ29tcG9zaXRlNDUxMSIgaW49ImZsb29kIiBpbjI9IlNvdXJjZUdyYXBoaWMiIG9wZXJhdG9yPSJvdXQiIHJlc3VsdD0iY29tcG9zaXRlMSIvPjxmZUdhdXNzaWFuQmx1ciBpZD0iZmVHYXVzc2lhbkJsdXI0NTEzIiBpbj0iY29tcG9zaXRlMSIgcmVzdWx0PSJibHVyIiBzdGREZXZpYXRpb249IjMiLz48ZmVPZmZzZXQgZHg9IjAiIGR5PSItMi42MDQxNyIgaWQ9ImZlT2Zmc2V0NDUxNSIgcmVzdWx0PSJvZmZzZXQiLz48ZmVDb21wb3NpdGUgaWQ9ImZlQ29tcG9zaXRlNDUxNyIgaW49Im9mZnNldCIgaW4yPSJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0iYXRvcCIgcmVzdWx0PSJmYlNvdXJjZUdyYXBoaWMiLz48ZmVDb2xvck1hdHJpeCBpZD0iZmVDb2xvck1hdHJpeDQ2ODciIGluPSJmYlNvdXJjZUdyYXBoaWMiIHJlc3VsdD0iZmJTb3VyY2VHcmFwaGljQWxwaGEiIHZhbHVlcz0iMCAwIDAgLTEgMCAwIDAgMCAtMSAwIDAgMCAwIC0xIDAgMCAwIDAgMSAwIi8+PGZlRmxvb2QgZmxvb2QtY29sb3I9InJnYigyNTUsMjQ0LDE1MykiIGZsb29kLW9wYWNpdHk9IjEiIGlkPSJmZUZsb29kNDY4OSIgaW49ImZiU291cmNlR3JhcGhpYyIgcmVzdWx0PSJmbG9vZCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU0NjkxIiBpbj0iZmxvb2QiIGluMj0iZmJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0ib3V0IiByZXN1bHQ9ImNvbXBvc2l0ZTEiLz48ZmVHYXVzc2lhbkJsdXIgaWQ9ImZlR2F1c3NpYW5CbHVyNDY5MyIgaW49ImNvbXBvc2l0ZTEiIHJlc3VsdD0iYmx1ciIgc3RkRGV2aWF0aW9uPSIzLjQiLz48ZmVPZmZzZXQgZHg9IjAiIGR5PSItMy45IiBpZD0iZmVPZmZzZXQ0Njk1IiByZXN1bHQ9Im9mZnNldCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU0Njk3IiBpbj0ib2Zmc2V0IiBpbjI9ImZiU291cmNlR3JhcGhpYyIgb3BlcmF0b3I9ImF0b3AiIHJlc3VsdD0iY29tcG9zaXRlMiIvPjwvZmlsdGVyPjwvZGVmcz48ZyBpZD0ibGF5ZXIzIiBzdHlsZT0iZGlzcGxheTppbmxpbmUiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsLTk5Ljk5OTk4OCkiPjxwYXRoIGQ9Ik0gMjAgMCBDIDguOTE5OTkwOSAwIDAgOC45MTk5OTA5IDAgMjAgTCAwIDgwIEMgMCA5MS4wODAwMDcgOC45MTk5OTA5IDEwMCAyMCAxMDAgTCA4MCAxMDAgQyA5MS4wODAwMDcgMTAwIDEwMCA5MS4wODAwMDcgMTAwIDgwIEwgMTAwIDIwIEMgMTAwIDguOTE5OTkwOSA5MS4wODAwMDcgMCA4MCAwIEwgMjAgMCB6IE0gNTAgMTMuNjM0NzY2IEEgMTYuMTI1MDA0IDE2LjEyNTAwNCAwIDAgMSA2Ni4xMjUgMjkuNzU5NzY2IEEgMTYuMTI1MDA0IDE2LjEyNTAwNCAwIDAgMSA1MCA0NS44ODQ3NjYgQSAxNi4xMjUwMDQgMTYuMTI1MDA0IDAgMCAxIDMzLjg3NSAyOS43NTk3NjYgQSAxNi4xMjUwMDQgMTYuMTI1MDA0IDAgMCAxIDUwIDEzLjYzNDc2NiB6IE0gNjEuNzY3NTc4IDQ3LjA2NjQwNiBDIDcwLjgxMjcxMSA1NC4yODY2MTcgNzcuOTIxODc1IDU4LjczOTM1MSA3Ny45MjE4NzUgODYuMzY1MjM0IEwgMjIuMDc4MTI1IDg2LjM2NTIzNCBDIDIyLjA3ODEyNSA1OS4yNDc5NjEgMjkuMTgxMzE2IDU0LjI5MjQyIDM4LjIyMjY1NiA0Ny4wNjgzNTkgQyA0MS45MTQ5NTQgNDguNjEwMTcgNDUuOTMyMTc2IDQ5LjQxMjg3NSA1MCA0OS40MjE4NzUgQyA1NC4wNjQ0NjMgNDkuNDExMDI1IDU4LjA3ODY0MyA0OC42MDc1NTYgNjEuNzY3NTc4IDQ3LjA2NjQwNiB6ICIgaWQ9InJlY3Q0MjA4IiBzdHlsZT0ib3BhY2l0eToxO2ZpbGw6IzAwMDAwMDtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6My43OTk5OTk5NTtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLWRhc2hvZmZzZXQ6MDtzdHJva2Utb3BhY2l0eToxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDk5Ljk5OTk4OCkiLz48L2c+PC9zdmc+';

		if (vm.user.thumbnail) {
			vm.avatar = vm.user.thumbnail;
			vm.url = vm.user.thumbnail;
			console.log(vm.avatar)
		} else {
			vm.avatar = vm.url = $scope.defaultThumbnail;
		}


		var toast = $mdToast.simple()
			.textContent('Profile deleted.')
			.action('OK')
			.highlightAction(true)
			.highlightClass('md-accent')// Accent is used by default, this just demonstrates the usage.
			.position('bottom right');
			

		vm.deleteProfile = function () {
			ProfileFactory.deleteProfile(vm.user.email).then(function (success) {
				$mdToast.show(toast).then(function (response) {
					$state.go("home.login");
				});
			}, function (err) {
				console.error("Failed to delete");
				$mdToast.show($mdToast.simple().textContent('Unable to delete profile.').action('OK').highlightAction(true).highlightClass('md-warn').position('bottom right'));
			})
		}

		vm.logout = function () {
			authService.logout();
			$state.go("home.login");
		}
	}
])

angular
		.module('app')
		.controller('LoginController', ['authService', 'ProfileFactory', '$state', '$scope', 
		'$timeout', '$mdToast', function (authService, ProfileFactory, $state, $scope, $timeout, $mdToast) {
		var vm = this;
		vm.formData = {};
		vm.auth = authService;
		if (vm.auth.isAuthenticated()) {
			//$state.go('home.main.index');
		}
		if (!vm.auth.isAuthenticated()) {
			$state.go('home.login');
		}

		$scope.isButtonDisabled = false;
		$scope.isQuerying = false;
		vm.submit = function () {
			$scope.isButtonDisabled = true;
			$scope.isQuerying = true;
			ProfileFactory.checkAvailability(vm.formData.email.toLowerCase()).then(function (response) {
				if (response.status == 200) {
					ProfileFactory.registerProfile(vm.formData.email.toLowerCase()).then(function (response) {
						authService.login(vm.formData.email.toLowerCase());
						$state.go('home.register');
					}, function (err) {
						$scope.isQuerying = false;
						$timeout(function () {
							$scope.isButtonDisabled = false;
						}, 5000);
						$mdToast.show(
							$mdToast.simple()
								.textContent(err.data.message)
								.action('OK')
								.highlightAction(true)
								.highlightClass('md-warn')
								.parent(document.querySelectorAll('#app-container'))
								.position('bottom right'));
					});
				} else if (response.status == 302) {
					$scope.isQuerying = false;
					authService.login(vm.formData.email.toLowerCase());
					$state.go('home.main.profile');
				}
			}, function (err) {
				$timeout(function () {
					$scope.isButtonDisabled = false;
				}, 5000);
				$scope.isQuerying = false;
				if (err.status == 500) {
					$mdToast.show(
						$mdToast.simple()
							.textContent(err.data.message)
							.action('OK')
							.highlightAction(true)
							.highlightClass('md-warn')
							.parent(document.querySelectorAll('#app-container'))
							.position('bottom right'));
				} else if (err.status == 302) {
					authService.login(vm.formData.email.toLowerCase());
					$state.go('home.main.profile');
				} else {
					authService.login(vm.formData.email.toLowerCase());
					$state.go('home.register');
				}
			});
		}
	}
])

angular
    .module('app')
    .controller('MessagesController', ['authService', 'UserProfile', 'ProfileFactory',
        'SecurityFactory', 'MediaFactory', '$state', '$http', '$window', '$scope', '$timeout',
        '$mdSidenav', '$mdToast',
        function (authService, UserProfile, ProfileFactory, SecurityFactory, MediaFactory,
            $state, $http, $window, $scope, $timeout, $mdSidenav, $mdToast) {

            var vm = this;
            vm.auth = authService;
            vm.user = UserProfile;
            $scope.$parent.currentNavItem = "messages";

            $scope.toggleLeft = buildDelayedToggler('left');

            /**
             * Supplies a function that will continue to operate until the
             * time is up.
             */
            function debounce(func, wait, context) {
                var timer;

                return function debounced() {
                    var context = $scope,
                        args = Array.prototype.slice.call(arguments);
                    $timeout.cancel(timer);
                    timer = $timeout(function () {
                        timer = undefined;
                        func.apply(context, args);
                    }, wait || 10);
                };
            }

            /**
             * Build handler to open/close a SideNav; when animation finishes
             * report completion in console
             */
            function buildDelayedToggler(navID) {
                return debounce(function () {
                    // Component lookup should always be available since we are not using `ng-if`
                    $mdSidenav(navID)
                        .toggle()
                        .then(function () {
                        });
                }, 200);
            }

            $scope.close = function () {
                // Component lookup should always be available since we are not using `ng-if`
                $mdSidenav('left').close()
                  .then(function () {
                  });
          
              };

              $scope.isOpen = function(){
                return $mdSidenav('left').isOpen();
              };
        }
    ])
angular
		.module('app')
		.controller('ProfileController', ['authService', 'UserProfile', 'ProfileFactory', 'SecurityFactory', '$state', '$http', '$window', '$scope', '$timeout', '$mdToast', function (authService, UserProfile, ProfileFactory, SecurityFactory, $state, $http, $window, $scope, $timeout, $mdToast) {


		var vm = this;
		vm.auth = authService;
		vm.user = UserProfile;

		vm.isOpen = false;
		$scope.$parent.currentNavItem = "profile";
		vm.post = '';
		$window.scrollTo(0, 0);


		var monthNames = ["January", "February", "March", "April", "May", "June",
			"July", "August", "September", "October", "November", "December"
		];

		var unformattedDOB = new Date(vm.user.DOB);
		$scope.formattedDOB = unformattedDOB.getDate() + " " + monthNames[unformattedDOB.getMonth()] + ", " + unformattedDOB.getFullYear();

		var d = new Date();

		vm.joinDate = d.getDate() + " " + monthNames[d.getMonth()] + ", " + d.getFullYear();

		$scope.defaultThumbnail = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaGVpZ2h0PSIxMDAiIGlkPSJzdmcyIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCA5OS45OTk5OTUgOTkuOTk5OTk1IiB3aWR0aD0iMTAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6aW5rc2NhcGU9Imh0dHA6Ly93d3cuaW5rc2NhcGUub3JnL25hbWVzcGFjZXMvaW5rc2NhcGUiIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIiB4bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcyBpZD0iZGVmczQiPjxmaWx0ZXIgaWQ9ImZpbHRlcjQ1MTAiIHN0eWxlPSJjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM6c1JHQiI+PGZlRmxvb2QgZmxvb2QtY29sb3I9InJnYigwLDAsMCkiIGZsb29kLW9wYWNpdHk9IjAuNDcwNTg4IiBpZD0iZmVGbG9vZDQ1MTIiIHJlc3VsdD0iZmxvb2QiLz48ZmVDb21wb3NpdGUgaWQ9ImZlQ29tcG9zaXRlNDUxNCIgaW49ImZsb29kIiBpbjI9IlNvdXJjZUdyYXBoaWMiIG9wZXJhdG9yPSJpbiIgcmVzdWx0PSJjb21wb3NpdGUxIi8+PGZlR2F1c3NpYW5CbHVyIGlkPSJmZUdhdXNzaWFuQmx1cjQ1MTYiIGluPSJjb21wb3NpdGUxIiByZXN1bHQ9ImJsdXIiIHN0ZERldmlhdGlvbj0iNSIvPjxmZU9mZnNldCBkeD0iMCIgZHk9IjQuNyIgaWQ9ImZlT2Zmc2V0NDUxOCIgcmVzdWx0PSJvZmZzZXQiLz48ZmVDb21wb3NpdGUgaWQ9ImZlQ29tcG9zaXRlNDUyMCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0ib2Zmc2V0IiBvcGVyYXRvcj0ib3ZlciIgcmVzdWx0PSJjb21wb3NpdGUyIi8+PC9maWx0ZXI+PGZpbHRlciBpZD0iZmlsdGVyNTA2NCIgc3R5bGU9ImNvbG9yLWludGVycG9sYXRpb24tZmlsdGVyczpzUkdCIj48ZmVGbG9vZCBmbG9vZC1jb2xvcj0icmdiKDIwNiwyNDIsMjQ1KSIgZmxvb2Qtb3BhY2l0eT0iMC44MzUyOTQiIGlkPSJmZUZsb29kNTA2NiIgcmVzdWx0PSJmbG9vZCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU1MDY4IiBpbj0iZmxvb2QiIGluMj0iU291cmNlR3JhcGhpYyIgb3BlcmF0b3I9Im91dCIgcmVzdWx0PSJjb21wb3NpdGUxIi8+PGZlR2F1c3NpYW5CbHVyIGlkPSJmZUdhdXNzaWFuQmx1cjUwNzAiIGluPSJjb21wb3NpdGUxIiByZXN1bHQ9ImJsdXIiIHN0ZERldmlhdGlvbj0iNS45Ii8+PGZlT2Zmc2V0IGR4PSIwIiBkeT0iLTguMSIgaWQ9ImZlT2Zmc2V0NTA3MiIgcmVzdWx0PSJvZmZzZXQiLz48ZmVDb21wb3NpdGUgaWQ9ImZlQ29tcG9zaXRlNTA3NCIgaW49Im9mZnNldCIgaW4yPSJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0iYXRvcCIgcmVzdWx0PSJjb21wb3NpdGUyIi8+PC9maWx0ZXI+PGZpbHRlciBpZD0iZmlsdGVyNTM2NCIgc3R5bGU9ImNvbG9yLWludGVycG9sYXRpb24tZmlsdGVyczpzUkdCIj48ZmVGbG9vZCBmbG9vZC1jb2xvcj0icmdiKDAsMCwwKSIgZmxvb2Qtb3BhY2l0eT0iMC44MzUyOTQiIGlkPSJmZUZsb29kNTM2NiIgcmVzdWx0PSJmbG9vZCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU1MzY4IiBpbj0iZmxvb2QiIGluMj0iU291cmNlR3JhcGhpYyIgb3BlcmF0b3I9ImluIiByZXN1bHQ9ImNvbXBvc2l0ZTEiLz48ZmVHYXVzc2lhbkJsdXIgaWQ9ImZlR2F1c3NpYW5CbHVyNTM3MCIgaW49ImNvbXBvc2l0ZTEiIHJlc3VsdD0iYmx1ciIgc3RkRGV2aWF0aW9uPSI1Ii8+PGZlT2Zmc2V0IGR4PSIwIiBkeT0iNC4yIiBpZD0iZmVPZmZzZXQ1MzcyIiByZXN1bHQ9Im9mZnNldCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU1Mzc0IiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJvZmZzZXQiIG9wZXJhdG9yPSJvdmVyIiByZXN1bHQ9ImZiU291cmNlR3JhcGhpYyIvPjxmZUNvbG9yTWF0cml4IGlkPSJmZUNvbG9yTWF0cml4NTU5MiIgaW49ImZiU291cmNlR3JhcGhpYyIgcmVzdWx0PSJmYlNvdXJjZUdyYXBoaWNBbHBoYSIgdmFsdWVzPSIwIDAgMCAtMSAwIDAgMCAwIC0xIDAgMCAwIDAgLTEgMCAwIDAgMCAxIDAiLz48ZmVGbG9vZCBmbG9vZC1jb2xvcj0icmdiKDI1NCwyNTUsMTg5KSIgZmxvb2Qtb3BhY2l0eT0iMSIgaWQ9ImZlRmxvb2Q1NTk0IiBpbj0iZmJTb3VyY2VHcmFwaGljIiByZXN1bHQ9ImZsb29kIi8+PGZlQ29tcG9zaXRlIGlkPSJmZUNvbXBvc2l0ZTU1OTYiIGluPSJmbG9vZCIgaW4yPSJmYlNvdXJjZUdyYXBoaWMiIG9wZXJhdG9yPSJvdXQiIHJlc3VsdD0iY29tcG9zaXRlMSIvPjxmZUdhdXNzaWFuQmx1ciBpZD0iZmVHYXVzc2lhbkJsdXI1NTk4IiBpbj0iY29tcG9zaXRlMSIgcmVzdWx0PSJibHVyIiBzdGREZXZpYXRpb249IjcuNiIvPjxmZU9mZnNldCBkeD0iMCIgZHk9Ii04LjEiIGlkPSJmZU9mZnNldDU2MDAiIHJlc3VsdD0ib2Zmc2V0Ii8+PGZlQ29tcG9zaXRlIGlkPSJmZUNvbXBvc2l0ZTU2MDIiIGluPSJvZmZzZXQiIGluMj0iZmJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0iYXRvcCIgcmVzdWx0PSJjb21wb3NpdGUyIi8+PC9maWx0ZXI+PGZpbHRlciBpZD0iZmlsdGVyNDQwMCIgc3R5bGU9ImNvbG9yLWludGVycG9sYXRpb24tZmlsdGVyczpzUkdCIj48ZmVGbG9vZCBmbG9vZC1jb2xvcj0icmdiKDAsMCwwKSIgZmxvb2Qtb3BhY2l0eT0iMC40NzA1ODgiIGlkPSJmZUZsb29kNDQwMiIgcmVzdWx0PSJmbG9vZCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU0NDA0IiBpbj0iZmxvb2QiIGluMj0iU291cmNlR3JhcGhpYyIgb3BlcmF0b3I9ImluIiByZXN1bHQ9ImNvbXBvc2l0ZTEiLz48ZmVHYXVzc2lhbkJsdXIgaWQ9ImZlR2F1c3NpYW5CbHVyNDQwNiIgaW49ImNvbXBvc2l0ZTEiIHJlc3VsdD0iYmx1ciIgc3RkRGV2aWF0aW9uPSI1Ii8+PGZlT2Zmc2V0IGR4PSIwIiBkeT0iNSIgaWQ9ImZlT2Zmc2V0NDQwOCIgcmVzdWx0PSJvZmZzZXQiLz48ZmVDb21wb3NpdGUgaWQ9ImZlQ29tcG9zaXRlNDQxMCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0ib2Zmc2V0IiBvcGVyYXRvcj0ib3ZlciIgcmVzdWx0PSJmYlNvdXJjZUdyYXBoaWMiLz48ZmVDb2xvck1hdHJpeCBpZD0iZmVDb2xvck1hdHJpeDQ2NDAiIGluPSJmYlNvdXJjZUdyYXBoaWMiIHJlc3VsdD0iZmJTb3VyY2VHcmFwaGljQWxwaGEiIHZhbHVlcz0iMCAwIDAgLTEgMCAwIDAgMCAtMSAwIDAgMCAwIC0xIDAgMCAwIDAgMSAwIi8+PGZlRmxvb2QgZmxvb2QtY29sb3I9InJnYigyNTUsMjUzLDE4MCkiIGZsb29kLW9wYWNpdHk9IjEiIGlkPSJmZUZsb29kNDY0MiIgaW49ImZiU291cmNlR3JhcGhpYyIgcmVzdWx0PSJmbG9vZCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU0NjQ0IiBpbj0iZmxvb2QiIGluMj0iZmJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0ib3V0IiByZXN1bHQ9ImNvbXBvc2l0ZTEiLz48ZmVHYXVzc2lhbkJsdXIgaWQ9ImZlR2F1c3NpYW5CbHVyNDY0NiIgaW49ImNvbXBvc2l0ZTEiIHJlc3VsdD0iYmx1ciIgc3RkRGV2aWF0aW9uPSI1Ii8+PGZlT2Zmc2V0IGR4PSIwIiBkeT0iLTUiIGlkPSJmZU9mZnNldDQ2NDgiIHJlc3VsdD0ib2Zmc2V0Ii8+PGZlQ29tcG9zaXRlIGlkPSJmZUNvbXBvc2l0ZTQ2NTAiIGluPSJvZmZzZXQiIGluMj0iZmJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0iYXRvcCIgcmVzdWx0PSJjb21wb3NpdGUyIi8+PC9maWx0ZXI+PGZpbHRlciBpZD0iZmlsdGVyNDY3OCIgc3R5bGU9ImNvbG9yLWludGVycG9sYXRpb24tZmlsdGVyczpzUkdCIj48ZmVGbG9vZCBmbG9vZC1jb2xvcj0icmdiKDI1NSwyNTMsMTgwKSIgZmxvb2Qtb3BhY2l0eT0iMSIgaWQ9ImZlRmxvb2Q0NjgwIiByZXN1bHQ9ImZsb29kIi8+PGZlQ29tcG9zaXRlIGlkPSJmZUNvbXBvc2l0ZTQ2ODIiIGluPSJmbG9vZCIgaW4yPSJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0ib3V0IiByZXN1bHQ9ImNvbXBvc2l0ZTEiLz48ZmVHYXVzc2lhbkJsdXIgaWQ9ImZlR2F1c3NpYW5CbHVyNDY4NCIgaW49ImNvbXBvc2l0ZTEiIHJlc3VsdD0iYmx1ciIgc3RkRGV2aWF0aW9uPSI1Ii8+PGZlT2Zmc2V0IGR4PSIwIiBkeT0iLTciIGlkPSJmZU9mZnNldDQ2ODYiIHJlc3VsdD0ib2Zmc2V0Ii8+PGZlQ29tcG9zaXRlIGlkPSJmZUNvbXBvc2l0ZTQ2ODgiIGluPSJvZmZzZXQiIGluMj0iU291cmNlR3JhcGhpYyIgb3BlcmF0b3I9ImF0b3AiIHJlc3VsdD0iY29tcG9zaXRlMiIvPjwvZmlsdGVyPjxmaWx0ZXIgaWQ9ImZpbHRlcjUwNDUiIHN0eWxlPSJjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM6c1JHQiI+PGZlRmxvb2QgZmxvb2QtY29sb3I9InJnYigyNTUsMjUwLDE3NSkiIGZsb29kLW9wYWNpdHk9IjEiIGlkPSJmZUZsb29kNTA0NyIgcmVzdWx0PSJmbG9vZCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU1MDQ5IiBpbj0iZmxvb2QiIGluMj0iU291cmNlR3JhcGhpYyIgb3BlcmF0b3I9Im91dCIgcmVzdWx0PSJjb21wb3NpdGUxIi8+PGZlR2F1c3NpYW5CbHVyIGlkPSJmZUdhdXNzaWFuQmx1cjUwNTEiIGluPSJjb21wb3NpdGUxIiByZXN1bHQ9ImJsdXIiIHN0ZERldmlhdGlvbj0iNSIvPjxmZU9mZnNldCBkeD0iMCIgZHk9Ii02IiBpZD0iZmVPZmZzZXQ1MDUzIiByZXN1bHQ9Im9mZnNldCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU1MDU1IiBpbj0ib2Zmc2V0IiBpbjI9IlNvdXJjZUdyYXBoaWMiIG9wZXJhdG9yPSJhdG9wIiByZXN1bHQ9ImNvbXBvc2l0ZTIiLz48L2ZpbHRlcj48ZmlsdGVyIGlkPSJmaWx0ZXI0NjA3IiBzdHlsZT0iY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzOnNSR0I7Ij48ZmVGbG9vZCBmbG9vZC1jb2xvcj0icmdiKDI1NSwyNDcsMTgwKSIgZmxvb2Qtb3BhY2l0eT0iMSIgaWQ9ImZlRmxvb2Q0NjA5IiByZXN1bHQ9ImZsb29kIi8+PGZlQ29tcG9zaXRlIGlkPSJmZUNvbXBvc2l0ZTQ2MTEiIGluPSJmbG9vZCIgaW4yPSJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0ib3V0IiByZXN1bHQ9ImNvbXBvc2l0ZTEiLz48ZmVHYXVzc2lhbkJsdXIgaWQ9ImZlR2F1c3NpYW5CbHVyNDYxMyIgaW49ImNvbXBvc2l0ZTEiIHJlc3VsdD0iYmx1ciIgc3RkRGV2aWF0aW9uPSI1Ii8+PGZlT2Zmc2V0IGR4PSIwIiBkeT0iLTYiIGlkPSJmZU9mZnNldDQ2MTUiIHJlc3VsdD0ib2Zmc2V0Ii8+PGZlQ29tcG9zaXRlIGlkPSJmZUNvbXBvc2l0ZTQ2MTciIGluPSJvZmZzZXQiIGluMj0iU291cmNlR3JhcGhpYyIgb3BlcmF0b3I9ImF0b3AiIHJlc3VsdD0iY29tcG9zaXRlMiIvPjwvZmlsdGVyPjxmaWx0ZXIgaWQ9ImZpbHRlcjQ1MDciIHN0eWxlPSJjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM6c1JHQjsiPjxmZUZsb29kIGZsb29kLWNvbG9yPSJyZ2IoMjU1LDI0OSwxOTkpIiBmbG9vZC1vcGFjaXR5PSIxIiBpZD0iZmVGbG9vZDQ1MDkiIHJlc3VsdD0iZmxvb2QiLz48ZmVDb21wb3NpdGUgaWQ9ImZlQ29tcG9zaXRlNDUxMSIgaW49ImZsb29kIiBpbjI9IlNvdXJjZUdyYXBoaWMiIG9wZXJhdG9yPSJvdXQiIHJlc3VsdD0iY29tcG9zaXRlMSIvPjxmZUdhdXNzaWFuQmx1ciBpZD0iZmVHYXVzc2lhbkJsdXI0NTEzIiBpbj0iY29tcG9zaXRlMSIgcmVzdWx0PSJibHVyIiBzdGREZXZpYXRpb249IjMiLz48ZmVPZmZzZXQgZHg9IjAiIGR5PSItMi42MDQxNyIgaWQ9ImZlT2Zmc2V0NDUxNSIgcmVzdWx0PSJvZmZzZXQiLz48ZmVDb21wb3NpdGUgaWQ9ImZlQ29tcG9zaXRlNDUxNyIgaW49Im9mZnNldCIgaW4yPSJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0iYXRvcCIgcmVzdWx0PSJmYlNvdXJjZUdyYXBoaWMiLz48ZmVDb2xvck1hdHJpeCBpZD0iZmVDb2xvck1hdHJpeDQ2ODciIGluPSJmYlNvdXJjZUdyYXBoaWMiIHJlc3VsdD0iZmJTb3VyY2VHcmFwaGljQWxwaGEiIHZhbHVlcz0iMCAwIDAgLTEgMCAwIDAgMCAtMSAwIDAgMCAwIC0xIDAgMCAwIDAgMSAwIi8+PGZlRmxvb2QgZmxvb2QtY29sb3I9InJnYigyNTUsMjQ0LDE1MykiIGZsb29kLW9wYWNpdHk9IjEiIGlkPSJmZUZsb29kNDY4OSIgaW49ImZiU291cmNlR3JhcGhpYyIgcmVzdWx0PSJmbG9vZCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU0NjkxIiBpbj0iZmxvb2QiIGluMj0iZmJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0ib3V0IiByZXN1bHQ9ImNvbXBvc2l0ZTEiLz48ZmVHYXVzc2lhbkJsdXIgaWQ9ImZlR2F1c3NpYW5CbHVyNDY5MyIgaW49ImNvbXBvc2l0ZTEiIHJlc3VsdD0iYmx1ciIgc3RkRGV2aWF0aW9uPSIzLjQiLz48ZmVPZmZzZXQgZHg9IjAiIGR5PSItMy45IiBpZD0iZmVPZmZzZXQ0Njk1IiByZXN1bHQ9Im9mZnNldCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU0Njk3IiBpbj0ib2Zmc2V0IiBpbjI9ImZiU291cmNlR3JhcGhpYyIgb3BlcmF0b3I9ImF0b3AiIHJlc3VsdD0iY29tcG9zaXRlMiIvPjwvZmlsdGVyPjwvZGVmcz48ZyBpZD0ibGF5ZXIzIiBzdHlsZT0iZGlzcGxheTppbmxpbmUiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsLTk5Ljk5OTk4OCkiPjxwYXRoIGQ9Ik0gMjAgMCBDIDguOTE5OTkwOSAwIDAgOC45MTk5OTA5IDAgMjAgTCAwIDgwIEMgMCA5MS4wODAwMDcgOC45MTk5OTA5IDEwMCAyMCAxMDAgTCA4MCAxMDAgQyA5MS4wODAwMDcgMTAwIDEwMCA5MS4wODAwMDcgMTAwIDgwIEwgMTAwIDIwIEMgMTAwIDguOTE5OTkwOSA5MS4wODAwMDcgMCA4MCAwIEwgMjAgMCB6IE0gNTAgMTMuNjM0NzY2IEEgMTYuMTI1MDA0IDE2LjEyNTAwNCAwIDAgMSA2Ni4xMjUgMjkuNzU5NzY2IEEgMTYuMTI1MDA0IDE2LjEyNTAwNCAwIDAgMSA1MCA0NS44ODQ3NjYgQSAxNi4xMjUwMDQgMTYuMTI1MDA0IDAgMCAxIDMzLjg3NSAyOS43NTk3NjYgQSAxNi4xMjUwMDQgMTYuMTI1MDA0IDAgMCAxIDUwIDEzLjYzNDc2NiB6IE0gNjEuNzY3NTc4IDQ3LjA2NjQwNiBDIDcwLjgxMjcxMSA1NC4yODY2MTcgNzcuOTIxODc1IDU4LjczOTM1MSA3Ny45MjE4NzUgODYuMzY1MjM0IEwgMjIuMDc4MTI1IDg2LjM2NTIzNCBDIDIyLjA3ODEyNSA1OS4yNDc5NjEgMjkuMTgxMzE2IDU0LjI5MjQyIDM4LjIyMjY1NiA0Ny4wNjgzNTkgQyA0MS45MTQ5NTQgNDguNjEwMTcgNDUuOTMyMTc2IDQ5LjQxMjg3NSA1MCA0OS40MjE4NzUgQyA1NC4wNjQ0NjMgNDkuNDExMDI1IDU4LjA3ODY0MyA0OC42MDc1NTYgNjEuNzY3NTc4IDQ3LjA2NjQwNiB6ICIgaWQ9InJlY3Q0MjA4IiBzdHlsZT0ib3BhY2l0eToxO2ZpbGw6IzAwMDAwMDtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6My43OTk5OTk5NTtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLWRhc2hvZmZzZXQ6MDtzdHJva2Utb3BhY2l0eToxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDk5Ljk5OTk4OCkiLz48L2c+PC9zdmc+';

		if (vm.user.thumbnail) {
			vm.avatar = vm.user.thumbnail;
			vm.url = vm.user.thumbnail;
			console.log(vm.avatar)
		} else {
			vm.avatar = vm.url = $scope.defaultThumbnail;
		}
	}
])

angular
	.module('app')
	.controller('RegisterController', ['UserProfile', 'FilePermissions', 'authService', 'ProfileFactory', 'LocationFactory',
		'SecurityFactory', 'MediaFactory', '$http', '$state', '$mdToast', '$mdConstant', '$mdDialog', '$q',
		'$log', '$scope', '$timeout',
		function (UserProfile, FilePermissions, authService, ProfileFactory, LocationFactory,
			SecurityFactory, MediaFactory, $http, $state, $mdToast, $mdConstant, $mdDialog, $q, $log,
			$scope, $timeout) {
			var vm = this;
			vm.auth = authService;
			vm.user = UserProfile;
			vm.page = 1;
			vm.firstname = '';
			vm.lastname = '';
			vm.headline = '';
			vm.state = '';
			vm.professions = [];
			vm.profession = '';
			vm.countries = [];
			vm.country = '';
			vm.phone = '';
			var thisYear = new Date();
			var today = new Date();
			vm.maxDate = new Date(thisYear.getFullYear() - 18, today.getMonth(), today.getDate());
			var form1 = {};
			var form2 = {};
			var form3 = {};
			$scope.isQueryingLocation = false;
			$scope.isRegistering = false;
			vm.imageSrc = '';

			$http.get('./apps/json/listings.json').then(function (json) {
				if (json) {
					vm.professions = vm.professions.concat(json.data);
					vm.profession = vm.professions[0];
					//vm.profession = vm.professions[0].text;
				} else {
					$log.error('No listings available');
				}
			}, function (err) {
				$log.error("Unable to parse JSON for professions.")
			});

			$http.get('./apps/json/countries.json').then(function (json) {
				if (json) {
					vm.countries = json.data;
				}
			}, function (err) {
				$log.error(err);
			});

			vm.nextPage = function (form) {
				if (vm.page < 3) {
					vm.page += 1;
				}
			}

			vm.goBack = function () {
				if (vm.page > 1) {
					vm.page = vm.page - 1;
				}
			}

			vm.countries = [];
			vm.statesAndProvinces = [];
			vm.stateOrProvince = '';

			$http.get('../apps/json/countries.json').then(function (json) {
				if (json) {
					vm.countries = json.data;
				}
			}, function (err) {
				$log.error(err);
			});

			function getAllStatesByCountryCode(countryCode, countries) {
				return $q(function (resolve, reject) {
					var tempStates = null;
					angular.forEach(countries, function (value, key) {
						if (value.countryCode === countryCode) {
							tempStates = value.states;
							resolve(value.states);
						}
					});
					if (!tempStates) {
						resolve([]);
					}
				});
			}

			function getDialCodeByCountryCode(countryCode, countries) {
				return $q(function (resolve, reject) {
					var dialCode = null;
					angular.forEach(countries, function (value, key) {
						if (value.code === countryCode) {
							dialCode = value.dial_code;
						}
					});
					resolve(dialCode);
				});
			}

			function searchStateByName(stateName, states) {
				return $q(function (resolve, reject) {
					var tempState = null;
					angular.forEach(states, function (value, key) {
						if (value.name === stateName) {
							tempState = value;
							resolve(value);
						}
					});
					if (!tempState) {
						reject(tempState);
					}
				});
			}

			vm.hasStatesAndProvinces = function () {
				return vm.statesAndProvinces && vm.statesAndProvinces.length > 0;
			}

			$scope.updateLocationForm = function (form) {
				$http.get('../apps/json/states_and_provinces.json').then(function (json) {
					if (json) {
						getAllStatesByCountryCode(vm.country.code, json.data).then(function (results) {
							vm.statesAndProvinces = results;
						});
						$http.get('../apps/json/dial_codes.json').then(function (json) {
							if (json) {
								getDialCodeByCountryCode(vm.country.code, json.data).then(function (result) {
									if (!vm.phone || vm.phone.length < 5) {
										vm.phone = result;
									}
								})
							}
						})
					}
				}, function (err) {
					$log.error('Unable to parse JSON for countries.')
				});
			}

			vm.verifyLocation = function (form) {
				form2 = form;
				vm.page = 2;

				//Below code works. Just too much for the demo 
				/*$scope.isQueryingLocation = true;
				return LocationFactory.getCoordinates(vm.country.code, vm.city, vm.stateOrProvince).then(function (results) {
					$scope.isQueryingLocation = false;
					if (!results) {
						vm.page = 1;
						$mdToast.show(
							$mdToast.simple()
								.textContent('Something appears to be wrong. Please try again later.')
								.action('OK')
								.highlightAction(true)
								.highlightClass('md-accent')
								.parent(document.querySelectorAll('#app-container'))
								.position('bottom right'));
					} else if (!results.candidates || results.candidates.length == 0) {
						vm.page = 1;
						$mdToast.show(
							$mdToast.simple()
								.textContent('We couldn\'t find a location that matched the one you gave us.')
								.action('OK')
								.highlightAction(true)
								.highlightClass('md-accent')
								.parent(document.querySelectorAll('#app-container'))
								.position('bottom right'));
					} else {
						vm.locationCandidates = results.candidates;
						vm.locationCandidate = vm.locationCandidates[0];
						form2 = form;
						vm.page = 2;
					}
				}, function (err) {
					$scope.isQueryingLocation = false;
					$mdToast.show(
						$mdToast.simple()
							.textContent('Something went wrong.')
							.action('OK')
							.highlightAction(true)
							.highlightClass('md-accent')
							.parent(document.querySelectorAll('#app-container'))
							.position('bottom right'));
				});*/
			}


			/** ---------------------------------------------- Second page -------------------------------------------------- **/
			vm.currentPreviewVisible = true;

			var emptyUrl = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaGVpZ2h0PSIxMDAiIGlkPSJzdmcyIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCA5OS45OTk5OTUgOTkuOTk5OTk1IiB3aWR0aD0iMTAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6aW5rc2NhcGU9Imh0dHA6Ly93d3cuaW5rc2NhcGUub3JnL25hbWVzcGFjZXMvaW5rc2NhcGUiIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIiB4bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcyBpZD0iZGVmczQiPjxmaWx0ZXIgaWQ9ImZpbHRlcjQ1MTAiIHN0eWxlPSJjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM6c1JHQiI+PGZlRmxvb2QgZmxvb2QtY29sb3I9InJnYigwLDAsMCkiIGZsb29kLW9wYWNpdHk9IjAuNDcwNTg4IiBpZD0iZmVGbG9vZDQ1MTIiIHJlc3VsdD0iZmxvb2QiLz48ZmVDb21wb3NpdGUgaWQ9ImZlQ29tcG9zaXRlNDUxNCIgaW49ImZsb29kIiBpbjI9IlNvdXJjZUdyYXBoaWMiIG9wZXJhdG9yPSJpbiIgcmVzdWx0PSJjb21wb3NpdGUxIi8+PGZlR2F1c3NpYW5CbHVyIGlkPSJmZUdhdXNzaWFuQmx1cjQ1MTYiIGluPSJjb21wb3NpdGUxIiByZXN1bHQ9ImJsdXIiIHN0ZERldmlhdGlvbj0iNSIvPjxmZU9mZnNldCBkeD0iMCIgZHk9IjQuNyIgaWQ9ImZlT2Zmc2V0NDUxOCIgcmVzdWx0PSJvZmZzZXQiLz48ZmVDb21wb3NpdGUgaWQ9ImZlQ29tcG9zaXRlNDUyMCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0ib2Zmc2V0IiBvcGVyYXRvcj0ib3ZlciIgcmVzdWx0PSJjb21wb3NpdGUyIi8+PC9maWx0ZXI+PGZpbHRlciBpZD0iZmlsdGVyNTA2NCIgc3R5bGU9ImNvbG9yLWludGVycG9sYXRpb24tZmlsdGVyczpzUkdCIj48ZmVGbG9vZCBmbG9vZC1jb2xvcj0icmdiKDIwNiwyNDIsMjQ1KSIgZmxvb2Qtb3BhY2l0eT0iMC44MzUyOTQiIGlkPSJmZUZsb29kNTA2NiIgcmVzdWx0PSJmbG9vZCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU1MDY4IiBpbj0iZmxvb2QiIGluMj0iU291cmNlR3JhcGhpYyIgb3BlcmF0b3I9Im91dCIgcmVzdWx0PSJjb21wb3NpdGUxIi8+PGZlR2F1c3NpYW5CbHVyIGlkPSJmZUdhdXNzaWFuQmx1cjUwNzAiIGluPSJjb21wb3NpdGUxIiByZXN1bHQ9ImJsdXIiIHN0ZERldmlhdGlvbj0iNS45Ii8+PGZlT2Zmc2V0IGR4PSIwIiBkeT0iLTguMSIgaWQ9ImZlT2Zmc2V0NTA3MiIgcmVzdWx0PSJvZmZzZXQiLz48ZmVDb21wb3NpdGUgaWQ9ImZlQ29tcG9zaXRlNTA3NCIgaW49Im9mZnNldCIgaW4yPSJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0iYXRvcCIgcmVzdWx0PSJjb21wb3NpdGUyIi8+PC9maWx0ZXI+PGZpbHRlciBpZD0iZmlsdGVyNTM2NCIgc3R5bGU9ImNvbG9yLWludGVycG9sYXRpb24tZmlsdGVyczpzUkdCIj48ZmVGbG9vZCBmbG9vZC1jb2xvcj0icmdiKDAsMCwwKSIgZmxvb2Qtb3BhY2l0eT0iMC44MzUyOTQiIGlkPSJmZUZsb29kNTM2NiIgcmVzdWx0PSJmbG9vZCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU1MzY4IiBpbj0iZmxvb2QiIGluMj0iU291cmNlR3JhcGhpYyIgb3BlcmF0b3I9ImluIiByZXN1bHQ9ImNvbXBvc2l0ZTEiLz48ZmVHYXVzc2lhbkJsdXIgaWQ9ImZlR2F1c3NpYW5CbHVyNTM3MCIgaW49ImNvbXBvc2l0ZTEiIHJlc3VsdD0iYmx1ciIgc3RkRGV2aWF0aW9uPSI1Ii8+PGZlT2Zmc2V0IGR4PSIwIiBkeT0iNC4yIiBpZD0iZmVPZmZzZXQ1MzcyIiByZXN1bHQ9Im9mZnNldCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU1Mzc0IiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJvZmZzZXQiIG9wZXJhdG9yPSJvdmVyIiByZXN1bHQ9ImZiU291cmNlR3JhcGhpYyIvPjxmZUNvbG9yTWF0cml4IGlkPSJmZUNvbG9yTWF0cml4NTU5MiIgaW49ImZiU291cmNlR3JhcGhpYyIgcmVzdWx0PSJmYlNvdXJjZUdyYXBoaWNBbHBoYSIgdmFsdWVzPSIwIDAgMCAtMSAwIDAgMCAwIC0xIDAgMCAwIDAgLTEgMCAwIDAgMCAxIDAiLz48ZmVGbG9vZCBmbG9vZC1jb2xvcj0icmdiKDI1NCwyNTUsMTg5KSIgZmxvb2Qtb3BhY2l0eT0iMSIgaWQ9ImZlRmxvb2Q1NTk0IiBpbj0iZmJTb3VyY2VHcmFwaGljIiByZXN1bHQ9ImZsb29kIi8+PGZlQ29tcG9zaXRlIGlkPSJmZUNvbXBvc2l0ZTU1OTYiIGluPSJmbG9vZCIgaW4yPSJmYlNvdXJjZUdyYXBoaWMiIG9wZXJhdG9yPSJvdXQiIHJlc3VsdD0iY29tcG9zaXRlMSIvPjxmZUdhdXNzaWFuQmx1ciBpZD0iZmVHYXVzc2lhbkJsdXI1NTk4IiBpbj0iY29tcG9zaXRlMSIgcmVzdWx0PSJibHVyIiBzdGREZXZpYXRpb249IjcuNiIvPjxmZU9mZnNldCBkeD0iMCIgZHk9Ii04LjEiIGlkPSJmZU9mZnNldDU2MDAiIHJlc3VsdD0ib2Zmc2V0Ii8+PGZlQ29tcG9zaXRlIGlkPSJmZUNvbXBvc2l0ZTU2MDIiIGluPSJvZmZzZXQiIGluMj0iZmJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0iYXRvcCIgcmVzdWx0PSJjb21wb3NpdGUyIi8+PC9maWx0ZXI+PGZpbHRlciBpZD0iZmlsdGVyNDQwMCIgc3R5bGU9ImNvbG9yLWludGVycG9sYXRpb24tZmlsdGVyczpzUkdCIj48ZmVGbG9vZCBmbG9vZC1jb2xvcj0icmdiKDAsMCwwKSIgZmxvb2Qtb3BhY2l0eT0iMC40NzA1ODgiIGlkPSJmZUZsb29kNDQwMiIgcmVzdWx0PSJmbG9vZCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU0NDA0IiBpbj0iZmxvb2QiIGluMj0iU291cmNlR3JhcGhpYyIgb3BlcmF0b3I9ImluIiByZXN1bHQ9ImNvbXBvc2l0ZTEiLz48ZmVHYXVzc2lhbkJsdXIgaWQ9ImZlR2F1c3NpYW5CbHVyNDQwNiIgaW49ImNvbXBvc2l0ZTEiIHJlc3VsdD0iYmx1ciIgc3RkRGV2aWF0aW9uPSI1Ii8+PGZlT2Zmc2V0IGR4PSIwIiBkeT0iNSIgaWQ9ImZlT2Zmc2V0NDQwOCIgcmVzdWx0PSJvZmZzZXQiLz48ZmVDb21wb3NpdGUgaWQ9ImZlQ29tcG9zaXRlNDQxMCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0ib2Zmc2V0IiBvcGVyYXRvcj0ib3ZlciIgcmVzdWx0PSJmYlNvdXJjZUdyYXBoaWMiLz48ZmVDb2xvck1hdHJpeCBpZD0iZmVDb2xvck1hdHJpeDQ2NDAiIGluPSJmYlNvdXJjZUdyYXBoaWMiIHJlc3VsdD0iZmJTb3VyY2VHcmFwaGljQWxwaGEiIHZhbHVlcz0iMCAwIDAgLTEgMCAwIDAgMCAtMSAwIDAgMCAwIC0xIDAgMCAwIDAgMSAwIi8+PGZlRmxvb2QgZmxvb2QtY29sb3I9InJnYigyNTUsMjUzLDE4MCkiIGZsb29kLW9wYWNpdHk9IjEiIGlkPSJmZUZsb29kNDY0MiIgaW49ImZiU291cmNlR3JhcGhpYyIgcmVzdWx0PSJmbG9vZCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU0NjQ0IiBpbj0iZmxvb2QiIGluMj0iZmJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0ib3V0IiByZXN1bHQ9ImNvbXBvc2l0ZTEiLz48ZmVHYXVzc2lhbkJsdXIgaWQ9ImZlR2F1c3NpYW5CbHVyNDY0NiIgaW49ImNvbXBvc2l0ZTEiIHJlc3VsdD0iYmx1ciIgc3RkRGV2aWF0aW9uPSI1Ii8+PGZlT2Zmc2V0IGR4PSIwIiBkeT0iLTUiIGlkPSJmZU9mZnNldDQ2NDgiIHJlc3VsdD0ib2Zmc2V0Ii8+PGZlQ29tcG9zaXRlIGlkPSJmZUNvbXBvc2l0ZTQ2NTAiIGluPSJvZmZzZXQiIGluMj0iZmJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0iYXRvcCIgcmVzdWx0PSJjb21wb3NpdGUyIi8+PC9maWx0ZXI+PGZpbHRlciBpZD0iZmlsdGVyNDY3OCIgc3R5bGU9ImNvbG9yLWludGVycG9sYXRpb24tZmlsdGVyczpzUkdCIj48ZmVGbG9vZCBmbG9vZC1jb2xvcj0icmdiKDI1NSwyNTMsMTgwKSIgZmxvb2Qtb3BhY2l0eT0iMSIgaWQ9ImZlRmxvb2Q0NjgwIiByZXN1bHQ9ImZsb29kIi8+PGZlQ29tcG9zaXRlIGlkPSJmZUNvbXBvc2l0ZTQ2ODIiIGluPSJmbG9vZCIgaW4yPSJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0ib3V0IiByZXN1bHQ9ImNvbXBvc2l0ZTEiLz48ZmVHYXVzc2lhbkJsdXIgaWQ9ImZlR2F1c3NpYW5CbHVyNDY4NCIgaW49ImNvbXBvc2l0ZTEiIHJlc3VsdD0iYmx1ciIgc3RkRGV2aWF0aW9uPSI1Ii8+PGZlT2Zmc2V0IGR4PSIwIiBkeT0iLTciIGlkPSJmZU9mZnNldDQ2ODYiIHJlc3VsdD0ib2Zmc2V0Ii8+PGZlQ29tcG9zaXRlIGlkPSJmZUNvbXBvc2l0ZTQ2ODgiIGluPSJvZmZzZXQiIGluMj0iU291cmNlR3JhcGhpYyIgb3BlcmF0b3I9ImF0b3AiIHJlc3VsdD0iY29tcG9zaXRlMiIvPjwvZmlsdGVyPjxmaWx0ZXIgaWQ9ImZpbHRlcjUwNDUiIHN0eWxlPSJjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM6c1JHQiI+PGZlRmxvb2QgZmxvb2QtY29sb3I9InJnYigyNTUsMjUwLDE3NSkiIGZsb29kLW9wYWNpdHk9IjEiIGlkPSJmZUZsb29kNTA0NyIgcmVzdWx0PSJmbG9vZCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU1MDQ5IiBpbj0iZmxvb2QiIGluMj0iU291cmNlR3JhcGhpYyIgb3BlcmF0b3I9Im91dCIgcmVzdWx0PSJjb21wb3NpdGUxIi8+PGZlR2F1c3NpYW5CbHVyIGlkPSJmZUdhdXNzaWFuQmx1cjUwNTEiIGluPSJjb21wb3NpdGUxIiByZXN1bHQ9ImJsdXIiIHN0ZERldmlhdGlvbj0iNSIvPjxmZU9mZnNldCBkeD0iMCIgZHk9Ii02IiBpZD0iZmVPZmZzZXQ1MDUzIiByZXN1bHQ9Im9mZnNldCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU1MDU1IiBpbj0ib2Zmc2V0IiBpbjI9IlNvdXJjZUdyYXBoaWMiIG9wZXJhdG9yPSJhdG9wIiByZXN1bHQ9ImNvbXBvc2l0ZTIiLz48L2ZpbHRlcj48ZmlsdGVyIGlkPSJmaWx0ZXI0NjA3IiBzdHlsZT0iY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzOnNSR0I7Ij48ZmVGbG9vZCBmbG9vZC1jb2xvcj0icmdiKDI1NSwyNDcsMTgwKSIgZmxvb2Qtb3BhY2l0eT0iMSIgaWQ9ImZlRmxvb2Q0NjA5IiByZXN1bHQ9ImZsb29kIi8+PGZlQ29tcG9zaXRlIGlkPSJmZUNvbXBvc2l0ZTQ2MTEiIGluPSJmbG9vZCIgaW4yPSJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0ib3V0IiByZXN1bHQ9ImNvbXBvc2l0ZTEiLz48ZmVHYXVzc2lhbkJsdXIgaWQ9ImZlR2F1c3NpYW5CbHVyNDYxMyIgaW49ImNvbXBvc2l0ZTEiIHJlc3VsdD0iYmx1ciIgc3RkRGV2aWF0aW9uPSI1Ii8+PGZlT2Zmc2V0IGR4PSIwIiBkeT0iLTYiIGlkPSJmZU9mZnNldDQ2MTUiIHJlc3VsdD0ib2Zmc2V0Ii8+PGZlQ29tcG9zaXRlIGlkPSJmZUNvbXBvc2l0ZTQ2MTciIGluPSJvZmZzZXQiIGluMj0iU291cmNlR3JhcGhpYyIgb3BlcmF0b3I9ImF0b3AiIHJlc3VsdD0iY29tcG9zaXRlMiIvPjwvZmlsdGVyPjxmaWx0ZXIgaWQ9ImZpbHRlcjQ1MDciIHN0eWxlPSJjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM6c1JHQjsiPjxmZUZsb29kIGZsb29kLWNvbG9yPSJyZ2IoMjU1LDI0OSwxOTkpIiBmbG9vZC1vcGFjaXR5PSIxIiBpZD0iZmVGbG9vZDQ1MDkiIHJlc3VsdD0iZmxvb2QiLz48ZmVDb21wb3NpdGUgaWQ9ImZlQ29tcG9zaXRlNDUxMSIgaW49ImZsb29kIiBpbjI9IlNvdXJjZUdyYXBoaWMiIG9wZXJhdG9yPSJvdXQiIHJlc3VsdD0iY29tcG9zaXRlMSIvPjxmZUdhdXNzaWFuQmx1ciBpZD0iZmVHYXVzc2lhbkJsdXI0NTEzIiBpbj0iY29tcG9zaXRlMSIgcmVzdWx0PSJibHVyIiBzdGREZXZpYXRpb249IjMiLz48ZmVPZmZzZXQgZHg9IjAiIGR5PSItMi42MDQxNyIgaWQ9ImZlT2Zmc2V0NDUxNSIgcmVzdWx0PSJvZmZzZXQiLz48ZmVDb21wb3NpdGUgaWQ9ImZlQ29tcG9zaXRlNDUxNyIgaW49Im9mZnNldCIgaW4yPSJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0iYXRvcCIgcmVzdWx0PSJmYlNvdXJjZUdyYXBoaWMiLz48ZmVDb2xvck1hdHJpeCBpZD0iZmVDb2xvck1hdHJpeDQ2ODciIGluPSJmYlNvdXJjZUdyYXBoaWMiIHJlc3VsdD0iZmJTb3VyY2VHcmFwaGljQWxwaGEiIHZhbHVlcz0iMCAwIDAgLTEgMCAwIDAgMCAtMSAwIDAgMCAwIC0xIDAgMCAwIDAgMSAwIi8+PGZlRmxvb2QgZmxvb2QtY29sb3I9InJnYigyNTUsMjQ0LDE1MykiIGZsb29kLW9wYWNpdHk9IjEiIGlkPSJmZUZsb29kNDY4OSIgaW49ImZiU291cmNlR3JhcGhpYyIgcmVzdWx0PSJmbG9vZCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU0NjkxIiBpbj0iZmxvb2QiIGluMj0iZmJTb3VyY2VHcmFwaGljIiBvcGVyYXRvcj0ib3V0IiByZXN1bHQ9ImNvbXBvc2l0ZTEiLz48ZmVHYXVzc2lhbkJsdXIgaWQ9ImZlR2F1c3NpYW5CbHVyNDY5MyIgaW49ImNvbXBvc2l0ZTEiIHJlc3VsdD0iYmx1ciIgc3RkRGV2aWF0aW9uPSIzLjQiLz48ZmVPZmZzZXQgZHg9IjAiIGR5PSItMy45IiBpZD0iZmVPZmZzZXQ0Njk1IiByZXN1bHQ9Im9mZnNldCIvPjxmZUNvbXBvc2l0ZSBpZD0iZmVDb21wb3NpdGU0Njk3IiBpbj0ib2Zmc2V0IiBpbjI9ImZiU291cmNlR3JhcGhpYyIgb3BlcmF0b3I9ImF0b3AiIHJlc3VsdD0iY29tcG9zaXRlMiIvPjwvZmlsdGVyPjwvZGVmcz48ZyBpZD0ibGF5ZXIzIiBzdHlsZT0iZGlzcGxheTppbmxpbmUiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsLTk5Ljk5OTk4OCkiPjxwYXRoIGQ9Ik0gMjAgMCBDIDguOTE5OTkwOSAwIDAgOC45MTk5OTA5IDAgMjAgTCAwIDgwIEMgMCA5MS4wODAwMDcgOC45MTk5OTA5IDEwMCAyMCAxMDAgTCA4MCAxMDAgQyA5MS4wODAwMDcgMTAwIDEwMCA5MS4wODAwMDcgMTAwIDgwIEwgMTAwIDIwIEMgMTAwIDguOTE5OTkwOSA5MS4wODAwMDcgMCA4MCAwIEwgMjAgMCB6IE0gNTAgMTMuNjM0NzY2IEEgMTYuMTI1MDA0IDE2LjEyNTAwNCAwIDAgMSA2Ni4xMjUgMjkuNzU5NzY2IEEgMTYuMTI1MDA0IDE2LjEyNTAwNCAwIDAgMSA1MCA0NS44ODQ3NjYgQSAxNi4xMjUwMDQgMTYuMTI1MDA0IDAgMCAxIDMzLjg3NSAyOS43NTk3NjYgQSAxNi4xMjUwMDQgMTYuMTI1MDA0IDAgMCAxIDUwIDEzLjYzNDc2NiB6IE0gNjEuNzY3NTc4IDQ3LjA2NjQwNiBDIDcwLjgxMjcxMSA1NC4yODY2MTcgNzcuOTIxODc1IDU4LjczOTM1MSA3Ny45MjE4NzUgODYuMzY1MjM0IEwgMjIuMDc4MTI1IDg2LjM2NTIzNCBDIDIyLjA3ODEyNSA1OS4yNDc5NjEgMjkuMTgxMzE2IDU0LjI5MjQyIDM4LjIyMjY1NiA0Ny4wNjgzNTkgQyA0MS45MTQ5NTQgNDguNjEwMTcgNDUuOTMyMTc2IDQ5LjQxMjg3NSA1MCA0OS40MjE4NzUgQyA1NC4wNjQ0NjMgNDkuNDExMDI1IDU4LjA3ODY0MyA0OC42MDc1NTYgNjEuNzY3NTc4IDQ3LjA2NjQwNiB6ICIgaWQ9InJlY3Q0MjA4IiBzdHlsZT0ib3BhY2l0eToxO2ZpbGw6IzAwMDAwMDtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6My43OTk5OTk5NTtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLWRhc2hvZmZzZXQ6MDtzdHJva2Utb3BhY2l0eToxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDk5Ljk5OTk4OCkiLz48L2c+PC9zdmc+';

			vm.loadedFile = [{
				mimetype: 'image/default',
				url: emptyUrl
			}];

			vm.file = [];


			$scope.pickFile = pickFile;
			var policy = null;
			var signature = null;

			function pickFile() {

				$mdToast.show(
					$mdToast.simple()
					.textContent('This feature isn\'t available at the moment. Click continue.')
					.action('OK')
					.highlightAction(true)
					.highlightClass('md-accent') // Accent is used by default, this just demonstrates the usage.
					.parent(document.querySelectorAll('#app-container'))
					.position('bottom right'));

				/*filepickerService.pickMultiple({
					mimetype: ['image/jpeg', 'image/png', 'image/webp'],
					maxSize: 10 * 1024 * 1024,
					maxFiles: 1,
					minFiles: 1,
					imageQuality: 100,
					imageDim: [800, 600],
					backgroundUpload: false,
					container: 'modal',
					hide: true,
					policy: FilePermissions.policy,
					signature: FilePermissions.signature
				},
					onSuccess,
					function (FPError) {
						console.error(FPError.toString());
					},
					function (FPProgress) {
						vm.progressPercentage = parseInt(FPProgress.progress);
						$scope.$digest();
					});*/
			}


			function onSuccess(Blob) {
				$timeout(function () {
					vm.progressPercentage = 0;
				}, 2000);

				vm.file = Blob;
				$scope.$apply();
			};

			$scope.$watchCollection('vm.file', function (newVal, oldVal) {
				if (newVal.length > 0)
					vm.currentPreviewVisible = false;
				else vm.currentPreviewVisible = true;
			})

			$scope.onAllFilesRemoved = function (ev, files) {}

			$scope.onFileRemoved = function (lfFile, idx, ev) {}

			$scope.onFileUploaded = function (url) {
				console.log("file uploaded callback!!");
				console.log(url)
				vm.loadedFile = [{
					url: url
				}];
				$scope.$apply();
			}




			/** ---------------------------------------------- Third page -------------------------------------------------- **/

			vm.interests = [];
			$scope.buttonDisabled = false;
			$scope.seperatorKeys = [$mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.COMMA, $mdConstant.KEY_CODE.SPACE];

			vm.save = function (form) {
				if (vm.auth.isAuthenticated()) {
					$log.log('Saving...');
					$scope.buttonDisabled = true;
					//showDialog(true);
					$scope.isSaving = true;

					var profile = {
						firstname: vm.firstname,
						lastname: vm.lastname,
						email: vm.user.email,
						profession: vm.profession,
						DOB: vm.DOB.toString(),
						country: vm.country,
						state: vm.stateOrProvince.name,
						city: vm.city,
						phone: vm.phone,
						gender: vm.gender,
						thumbnail: (Array.isArray(vm.loadedFile) && (vm.loadedFile.length > 0)) ? vm.loadedFile[0].url : ''
					};

					ProfileFactory.saveProfile(UserProfile._id, profile).then(function (result) {
						if (result && result.status == '200') {
							$scope.isSaving = false;
							$state.go('home.main.profile');
						} else {
							$scope.isSaving = false;
							$mdToast.show(
								$mdToast.simple()
								.textContent('Unable to register your account. Please try again later.')
								.action('OK')
								.highlightAction(true)
								.highlightClass('md-accent') // Accent is used by default, this just demonstrates the usage.
								.parent(document.querySelectorAll('#app-container'))
								.position('bottom right'));
							$timeout(function () {
								$scope.buttonDisabled = false;
							}, 5000);
						}
					}, function (err) {
						$scope.isSaving = false;
						$log.error('Unable to register profile');
						$mdToast.show(
							$mdToast.simple()
							.textContent('Unable to register your account. Please try again later.')
							.action('OK')
							.highlightAction(true)
							.highlightClass('md-accent') // Accent is used by default, this just demonstrates the usage.
							.parent(document.querySelectorAll('#app-container'))
							.position('bottom right'));
						$timeout(function () {
							$scope.buttonDisabled = false;
						}, 5000);
					});
					/*$timeout(function () {
						$scope.buttonDisabled = false;
					}, 5000);*/
				}
			}

			var showDialog = function (isSaving) {
				if (isSaving) {
					$scope.isSaving = isSaving;
					$mdDialog.show({
						//controller: DialogController,
						templateUrl: './apps/views/progress-dialog.html',
						parent: angular.element(document.body),
						scope: $scope,
						preserveScope: true,
						controller: function () {
							$scope.$watch('isSaving', function (newValue, oldValue, scope) {
								if (newValue == false) {
									$mdDialog.cancel();
								}
							})
						},
						clickOutsideToClose: false,
						escapeToClose: false,
						fullscreen: false // Only for -xs, -sm breakpoints.
					});
				}
			};
		}
	])
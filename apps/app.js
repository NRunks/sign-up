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
					UserProfile: function (ProfileFactory, authService, $state) {
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
					},
					FilePermissions: function (SecurityFactory, $http, $q, $log) {
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
					}
				}
			})
			.state('home.main', {
				abstract: true,
				templateUrl: './apps/views/main-toolbar.html',
				controller: 'HomeController',
				controllerAs: 'vm',
				resolve: {
					UserProfile: function (ProfileFactory, authService, $state) {
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
					},
					FilePermissions: function (SecurityFactory, $http, $q, $log) {
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
					}
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

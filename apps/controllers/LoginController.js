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

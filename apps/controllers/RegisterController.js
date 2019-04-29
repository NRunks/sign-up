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
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
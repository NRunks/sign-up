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
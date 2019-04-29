var genReObjId = function () {
	return 'reObjyxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = Math.random() * 16 | 0,
			v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
};

angular
	.module('app')
	.run(function ($templateCache) {
		$templateCache.put('reAlbumBox-1.html', [
			'<div class="re-albm-preview-container" flex layout="column" layout-align="center center" ng-if="vm.albums.length > 0" ng-repeat="album in reAlbums">',
			'<re-album re-album-obj="album"/></div>'
		].join(''));
	});

angular
	.module('app')
	.run(function ($templateCache) {
		$templateCache.put('reAlbum-1.html', [
			'<div class="album-outer-wrapper">',
			'<a class="buttons prev" href="#" ng-click="prevStackItem()"><</a><a class="buttons next" href="#" ng-click="nextStackItem()">></a>',
			'<div class="stack" ng-repeat="file in reAlbumObj.media"><div class="album-inner-wrapper" ng-if="isCurrent($index)">',
			'<div class="numbertext">{{currentIndex + 1}} / {{reAlbumObj.media.length}}</div>',
			'<re-file re-file-obj="reAlbumObj.media[$index]" class="fade" lf-unknow-class="strUnknowIconCls" security/></div></div></div>'
		].join(''));
	});

angular
	.module('app')
	.directive('albumBox', function (SecurityFactory, $compile) {
		return {
			restrict: 'E',
			replace: true,
			templateUrl: function (element, attrs) {
				return 'reAlbumBox-1.html';
			},
			scope: {
				reAlbums: '=',
			},
			link: function (scope, element, attrs, ctrl) {
			}
		};
	});

angular
	.module('app')
	.directive('reAlbum', function (SecurityFactory) {
		return {
			restrict: 'E',
			replace: true,
			templateUrl: function (element, attrs) {
				return 'reAlbum-1.html';
			},
			scope: {
				reAlbumObj: '='
			},
			link: function (scope, element, attrs) {
				scope.currentIndex = 0;

				scope.isCurrent = function (idx) {
					return idx == scope.currentIndex;
				}

				scope.prevStackItem = function () {
					if (scope.currentIndex > 0) {
						scope.currentIndex -= 1;
					}
				}

				scope.nextStackItem = function () {
					if (scope.currentIndex < scope.reAlbumObj.media.length-1) {
						scope.currentIndex += 1;
					}
				}
			}
		};
	});

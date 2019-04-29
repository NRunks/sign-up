angular
	.module('app')
	.directive('reFeedItem', function () {
		return {
			restrict: 'E',
			replace: false,
			scope: {
				reType: '@',
				reItem: '=',
				rePoster: '@'
			},
			link: function (scope, element, attrs) {
				console.log(scope.reType)
				if (scope.reType.indexOf('photo') !== -1) {
					console.log("We in here!");
					console.log(scope.reItem);
					var url = "https://farm" + scope.reItem.farm + ".staticflickr.com/" + scope.reItem.server
						+ "/" + scope.reItem.id + "_" + scope.reItem.secret + ".jpg"
					element.replaceWith(
						'<span md-truncate class="author heading">' + scope.rePoster + ' uploaded a new photo</span>'
						+ '<div class="image-post" layout="row" layout-align="center center" flex style="background: blue;">'
						+ '<img src="' + url + '" check-image flex /></div>'
					);
				} else if (scope.reType.indexOf('article') !== -1) {
					var author = scope.reItem.author;
					var description = scope.reItem.description;
					var source = scope.reItem.source.name;
					var title = scope.reItem.title;
					var url = scope.reItem.url;
					var urlToImage = scope.reItem.urlToImage;
					var publishedAt = scope.reItem.publishedAt;
					element.replaceWith(
						'<img src="' + urlToImage + '" ng-click="onArticleClick("' + url + '") check-image />'
					);
				} else if (scope.reType.indexOf('album') !== -1) {
					var artists = scope.reItem[0].artists;
					var albumName = scope.reItem[0].name;
					var albumUrl = scope.reItem[0].url;
					var albumCover = scope.reItem[0].image[2]['#text'];
					element.replaceWith(
						'<img src="' + urlToImage + '" ng-click="onAlbumClick("' + url + '") check-image />'
					);

				} else if (scope.reType.indexOf('quote') !== -1) {
					var quote = scope.reItem.quoteText;
					var quoteAuthor = scope.reItem.quoteAuthor;
					element.replaceWith(
						'<p>' + quote + '</p>'
					);
				} else {
					console.log("unknown type!");
					/*if (scope.reFileObj.reFile == void 0) {
						scope.reType = 'unknown/unknown';
					}
					element.replaceWith(
						'<object type="' + scope.reType + '" data="' + makeURL(src, security.policy, security.signature) + '">' +
						'<div class="lf-ng-md-file-input-preview-default">' +
						'<md-icon class="lf-ng-md-file-input-preview-icon ' + unKnowClass + '"></md-icon>' +
						'</div>' +
						'</object>'
					);*/
				}
			}
		};
	});
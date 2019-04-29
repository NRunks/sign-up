angular
    .module('app')
    .run(function ($templateCache) {
        $templateCache.put('imageuploader.html', [
            '<form id="frmUploader" enctype="multipart/form-data" method="post">' +
            '<input id="imgUploader" name="imgUploader" type="file" accept="image/jpeg, image/png" class="inputfile"/>' +
            '<label for="imgUploader"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="17" viewBox="0 0 20 17">' +
            '<path d="M10 0l-5.2 4.9h3.3v5.1h3.8v-5.1h3.3l-5.2-4.9zm9.3 11.5l-3.2-2.1h-2l3.4 2.6h-3.5c-.1 0-.2.1-.2.1l-.8 2.3h-6l-.8-2.2c-.1-.1-.1-.2-.2-.2h-3.6l3.4-2.6h-2l-3.2 2.1c-.4.3-.7 1-.6 1.5l.6 3.1c.1.5.7.9 1.2.9h16.3c.6 0 1.1-.4 1.3-.9l.6-3.1c.1-.5-.2-1.2-.7-1.5z" /></svg>' +
            '<span>Choose a file&hellip;</span></label><md-progress-linear md-mode="indeterminate" ng-disabled="!isUploading"></md-progress-linear></form>'
        ].join(''));
    });

angular
    .module('app')
    .directive('imgUploader', function (SecurityFactory, $q, $compile, $timeout) {
        return {
            restrict: 'E',
            templateUrl: function (element, attrs) {
                return 'imageuploader.html';
            },
            replace: true,
            scope: {
                iuOnFileUploaded: '='
            },
            link: function (scope, element, attrs, ctrl) {
                angular.element(document).ready(function () {

                    scope.file = [];
                    scope.isUploading = false;

                    $('#frmUploader').on("change", function () {
                        scope.$apply(function () {
                            scope.isUploading = true;
                        });
                        scope.file[0] = $("#imgUploader").get(0).files[0];
                        var formData = new FormData();
                        formData.append('imgUploader', scope.file[0]);
                        console.log(formData)
                        fetch('upload/upload-image', {
                            method: 'POST',
                            body: formData
                        }).then(response => {
                            console.log(response);
                            scope.onFileUploaded(response.statusText)
                            scope.$apply(function () {
                                scope.isUploading = false;
                            });
                        });
                    });
                });

                scope.onFileUploaded = function (url) {
                    scope.iuOnFileUploaded(url);
                };
            }
        }
    });
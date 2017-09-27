'use strict';

var cs142App = angular.module('cs142App', ['ngRoute', 'ngMaterial', 'ngResource']);

cs142App.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.
            when('/users', {
                templateUrl: 'components/user-list/user-listTemplate.html',
                controller: 'UserListController'
            }).
            when('/users/:userId', {
                templateUrl: 'components/user-detail/user-detailTemplate.html',
                controller: 'UserDetailController'
            }).
            when('/photos/:userId', {
                templateUrl: 'components/user-photos/user-photosTemplate.html',
                controller: 'UserPhotosController'
            }).
            when('/login-register', {
                templateUrl: 'components/login-register/login-registerTemplate.html',
                controller: 'LoginRegisterController'
            }).
            otherwise({
                redirectTo: '/users'
            });
    }]);

cs142App.controller('MainController', ['$scope', '$rootScope', 
                                        '$location', '$http', '$resource', '$mdDialog',
    function ($scope, $rootScope, $location, $http, $resource, $mdDialog) {
        $scope.main = {};
        $scope.main.title = 'Users';
        $scope.main.context = "";
        $scope.main.versionNumber = "N/A";
        $scope.main.getUserHref = function (user) {
            return '#!/users/' + user._id;
        };
        let SchemaInfo = $resource("/test/info");
        $scope.main.loggedInUser = undefined;
        $rootScope.$on( "$routeChangeStart", function(event, next, current) {
            if ($scope.main.loggedInUser === undefined) {
                // no logged user, redirect to /login-register unless already there
                if (next.templateUrl !== "components/login-register/login-registerTemplate.html") {
                    $location.path("/login-register");
                }
            } else {
                if (next.templateUrl === "components/login-register/login-registerTemplate.html") {
                    $location.path("/users/" + $scope.main.loggedInUser._id);
                }
            }
        });

        $scope.main.selectedPhotoFile = undefined;  

        $scope.main.showAdvanced = function() {
                $mdDialog.show({
                controller: 'DialogController',
                scope: $scope.$new(),
                templateUrl: 'components/dialog/dialogTemplate.html',
                parent: angular.element(document.body)
            })
            .then(function(trusted_users) {
                let restricted = true;
                $scope.main.uploadPhoto(restricted, trusted_users);
            }, function() {
                let restricted = false;
                let trusted_users = [];
                $scope.main.uploadPhoto(restricted, trusted_users);
            });
        };

        $scope.main.inputFileNameChanged = function (element) {
            $scope.main.selectedPhotoFile = element.files[0];
            if ($scope.main.inputFileNameSelected()) {
                $scope.main.showAdvanced();
            }
        };

        // Has the user selected a file?
        $scope.main.inputFileNameSelected = function () {
            return !!$scope.main.selectedPhotoFile;
        };

        // Upload the photo file selected by the user using a post request to the URL /photos/new
        $scope.main.uploadPhoto = function (restricted, trusted_users) {
            if (!$scope.main.inputFileNameSelected()) {
                console.error("uploadPhoto called with no selected file");
                return;
            }
            console.log('fileSubmitted', $scope.main.selectedPhotoFile);

            // Create a DOM form and add the file to it under the name uploadedphoto
            let domForm = new FormData();
            domForm.append('uploadedphoto', $scope.main.selectedPhotoFile);
            domForm.append('restricted', restricted);
            domForm.append('trusted_users', trusted_users);

            // Using $http to POST the form
            $http.post('/photos/new', domForm, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }).then(function successCallback(response){
                // The photo was successfully uploaded. XXX - Do whatever you want on success.
                $rootScope.$broadcast('photoUploaded');
                $location.path("/photos/" + $scope.main.loggedInUser._id);
            }, function errorCallback(response){
                // Couldn't upload the photo. XXX  - Do whatever you want on failure.
                console.error('ERROR uploading photo', response);
            });

        };

        $scope.main.logout = function() {
            $http.post('/admin/logout').then(function successCallback(response) {
                $scope.main.loggedInUser = undefined;
                $rootScope.$broadcast('loggedOut');
                $location.path("/users");
            }, function errorCallback(response) {
                alert(response.data);
            });

        };

        let load = function() {
            let schema_info = SchemaInfo.get( function() {
                $scope.main.versionNumber = schema_info.__v;
            });
        };
        load();
        $scope.$on('loggedIn', load);
        $scope.$on('loggedOut', load);
        $scope.$on('photoUploaded', load);

    }]);



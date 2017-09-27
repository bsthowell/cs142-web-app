'use strict';

cs142App.controller('LoginRegisterController', ['$scope', '$resource', '$http', '$location', '$rootScope',
	function($scope, $resource, $http, $location, $rootScope) {
        $scope.main.title = 'Login/Register';
        $scope.main.context = "Login/Register";
		$scope.login = {};
		$scope.login.submit = function() {
			let requestBody = {
				login_name: $scope.login.loginName,
				password: $scope.login.password
			};
			$http.post('/admin/login', JSON.stringify(requestBody)).then(function successCallback(response) {
				$scope.main.loggedInUser = response.data;
				$rootScope.$broadcast('loggedIn');
				$location.path("/users/" + $scope.main.loggedInUser._id);
			}, function errorCallback(response) {
				//change error from alert to view message
				alert(response.data);
			});
		};
		$scope.register = {};
		$scope.register.submit = function() {
			if ($scope.register.password1 !== $scope.register.password2) {
				alert("passwords do not match");
				return;
			}
			let requestBody = {
				login_name: $scope.register.login_name,
				password: $scope.register.password1,
				first_name: $scope.register.first_name,
				last_name: $scope.register.last_name,
				location: $scope.register.location,
				description: $scope.register.description,
				occupation: $scope.register.occupation
			};
			$http.post('/user', JSON.stringify(requestBody)).then(function successCallback(response) {
				$scope.main.loggedInUser = response.data;
				$rootScope.$broadcast('loggedIn');
				$location.path("/users/" + $scope.main.loggedInUser._id);
			}, function errorCallback(response) {
				alert(response.data);
			});
		};
	}]);
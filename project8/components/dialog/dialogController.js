'use strict';

cs142App.controller('DialogController', ['$scope', '$rootScope', '$mdDialog', '$resource',
	function( $scope, $rootScope, $mdDialog, $resource
		) {

		$scope.dialog = {};
	    $scope.dialog.users = [];
		let UserList = $resource("/user/list");
        $scope.dialog.users = UserList.query(function() {
	        $scope.dialog.users.forEach(function(user, index) {
	        	if(user._id === $scope.main.loggedInUser._id) {
	        		$scope.dialog.users.splice(index,1);
	        	}
	        });
        });
        $scope.dialog.trusted_users_map = {};
        $scope.dialog.trusted_users = [];

	    $scope.dialog.cancel = function() {
	      $mdDialog.cancel();
	    };

	    $scope.dialog.answer = function() {
	    	Object.keys($scope.dialog.trusted_users_map).forEach(function(key) {
	    		let value = $scope.dialog.trusted_users_map[key];
	    		if (value) {
	    			$scope.dialog.trusted_users.push(key);
	    		}
	    	});
	    	$scope.dialog.trusted_users.push($scope.main.loggedInUser._id);
	    	$mdDialog.hide($scope.dialog.trusted_users);
	    };
	}]);
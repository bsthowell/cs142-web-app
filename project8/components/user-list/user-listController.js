'use strict';

cs142App.controller('UserListController', ['$scope', '$resource',
    function ($scope, $resource) {
        $scope.list = {};
        $scope.list.users = [];
		let UserList = $resource("/user/list");
        let load = function() {
		    $scope.main.title = 'Users';
		    $scope.main.context = "User List";
	        $scope.list.users = UserList.query();
    	};
    	load();
    	$scope.$on('loggedIn', load);
    	$scope.$on('loggedOut', load);
        $scope.$on('userDeleted', load);
    }]);


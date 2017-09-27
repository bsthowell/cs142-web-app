'use strict';

cs142App.controller('UserDetailController', ['$scope', '$rootScope', '$location', '$routeParams', '$resource', '$http', '$mdDialog',
  function ($scope, $rootScope, $location, $routeParams, $resource, $http, $mdDialog
    ) {
    /*
     * Since the route is specified as '/users/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    var userId = $routeParams.userId;
    $scope.detail = {};
    $scope.detail.user = {};

    let User = $resource("/user/:id", {id:userId});

    $scope.detail.getPhotosHref = function () {
        return "#!/photos/" + userId;
    };

    $scope.detail.isLoggedIn = function() {
      return $scope.detail.user._id === $scope.main.loggedInUser._id;
    };

    $scope.detail.showConfirm = function(event) {
      // Appending dialog to document.body to cover sidenav in docs app
      var confirm = $mdDialog.confirm()
          .title('Are you sure you would like to delete your account?')
          .textContent('This will permanently delete all of your content.')
          .targetEvent(event)
          .ok('Delete')
          .cancel('Cancel');

      $mdDialog.show(confirm).then(function() {
        let request_body = {
          user_id: $scope.detail.user._id
        };
        $http.post('/deleteUser', JSON.stringify(request_body)).then(function successCallback(response) {
          $scope.main.loggedInUser = undefined;
          $rootScope.$broadcast('userDeleted');
          $location.path('/users');
        }, function errorCallback(response) {
          alert(response.data);
        });
      }, function() {});
    };

    let load = function() {
      $scope.detail.user = User.get(function() {
          $scope.detail.full_name = $scope.detail.user.first_name + " " + $scope.detail.user.last_name;
          $scope.main.title = $scope.detail.full_name;
          $scope.main.context = $scope.detail.full_name;  
      });
    };

    load();
    $scope.$on('loggedIn', load);
    $scope.$on('loggedOut', load);

  }]);

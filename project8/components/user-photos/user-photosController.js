'use strict';

cs142App.controller('UserPhotosController', ['$scope', '$rootScope', '$routeParams', '$resource', '$http',
  function($scope, $rootScope, $routeParams, $resource, $http) {
    /*
     * Since the route is specified as '/photos/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    var userId = $routeParams.userId;
    $scope.photos = {};

    let User = $resource("/user/:id", {id:userId});     
    let Photos = $resource("/photosOfUser/:id", {id:userId}); 

    let load = function() { 
      $scope.photos.user = {};
      $scope.photos.photoArray = [];
      $scope.photos.full_name = "";
      $scope.photos.comments = {};
      $scope.photos.user = User.get(function() {
        $scope.photos.full_name = $scope.photos.user.first_name + " " + $scope.photos.user.last_name;
        $scope.main.context = "Photos of " + $scope.photos.full_name;
      });
      $scope.photos.photoArray = Photos.query(function(currentValue) {
        $scope.photos.photoArray = $scope.photos.photoArray.sort(function compareFunction(photo_a, photo_b) {
          if( photo_a.num_likes > photo_b.num_likes) {
            return -1;
          }
          if( photo_a.num_likes < photo_b.num_likes) {
            return 1;
          }
          return 0;
        });
        $scope.photos.photoArray.forEach(function callback(currentPhoto) {
          currentPhoto.hasLiked = (currentPhoto.likes_ids.indexOf($scope.main.loggedInUser._id) >= 0);
        });
      });
    };

    load();

    $scope.photos.getPhotoSrc = function(photo) {
      return "images/" + photo.file_name;
    };

    $scope.photos.postComment = function(photo) {
      let photo_id = photo._id;
      let request_body = JSON.stringify({comment: $scope.photos.comments[photo_id]});
      $http.post("/commentsOfPhoto/" + photo_id, request_body).then(function successCallback(response) {
        $rootScope.$broadcast("commentPosted");
      }, function errorCallback(response) {
        alert(response.data);
      });
    };

    $scope.photos.like = function(photo) {
      let photo_id = photo._id;
      let request_body = {
        photo_id: photo_id
      };
      $http.post('/likePhoto', JSON.stringify(request_body)).then(function successCallback(response) {
        $rootScope.$broadcast("photoLiked");
      }, function errorCallback(response) {
        alert(response.data);
      });
    };

    $scope.photos.unlike = function(photo) {
      let photo_id = photo._id;
      let request_body = {
        photo_id: photo_id
      };
      $http.post('/unlikePhoto', JSON.stringify(request_body)).then(function successCallback(response) {
        $rootScope.$broadcast("photoUnliked");
      }, function errorCallback(response) {
        alert(response.data);
      });
    };

    $scope.photos.isUsersComment = function(comment) {
      return $scope.main.loggedInUser._id === comment.user._id;
    };

    $scope.photos.isUsersPhoto = function(photo) {
      return $scope.main.loggedInUser._id === photo.user_id;
    };

    $scope.photos.deleteComment = function(photo, comment) {
      let photo_id = photo._id;
      let comment_id = comment._id;
      let request_body = {
        photo_id: photo_id,
        comment_id: comment_id
      };
      $http.post('/deleteComment', JSON.stringify(request_body)).then(function successCallback(response) {
        $rootScope.$broadcast("commentDeleted");
      }, function errorCallback(response) {
        alert(response.data);
      });
    };

  $scope.photos.deletePhoto = function(photo) {
    let photo_id = photo._id;
    let request_body = {
      photo_id: photo_id
    };
    $http.post('/deletePhoto', JSON.stringify(request_body)).then(function successCallback(response) {
      $rootScope.$broadcast("photoDeleted");
    }, function errorCallback(response) {
      alert(response.data);
    });
  };    

    $scope.$on("commentPosted", load);
    $scope.$on("commentDeleted", load);
    $scope.$on("photoLiked", load);
    $scope.$on("photoUnliked", load);
    $scope.$on('photoUploaded', load);
    $scope.$on('photoDeleted', load);

  }]);

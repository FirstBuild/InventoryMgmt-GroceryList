'use strict';

/* Controllers */

angular.module('fbGroceryList.controllers', ['firebase.utils', 'simpleLogin'])
  .controller('HomeCtrl', ['$scope', 'fbutil', 'user', 'FBURL', function($scope, fbutil, user, FBURL) {
    $scope.syncedValue = fbutil.syncObject('syncedValue');
    $scope.user = user;
    $scope.FBURL = FBURL;
  }])

  .controller('ListCtrl', ['$scope', 'simpleLogin', 'fbutil', 'user', '$location', '$firebase',
    function($scope, simpleLogin, fbutil, user, $location, $firebase) {
      // for now, hardcode grocery list until we have strategy for storing that
      $scope.groceryList = "-JUe8qcgJOZsHYZCogge";

      $scope.addItem = function(item) {
        var objectRef = $firebase(fbutil.ref('objects'));
        var containerRef = $firebase(fbutil.ref('containers', $scope.groceryList, 'objects' ));

        var groceryItem = {
          checked: false,
          container: $scope.groceryList,
          data: item
        }
        // first push new object into object list, and then push into users Grocery List
        objectRef.$push(groceryItem).then(function(newObject) {
          var containerIndexValue = {};
          containerIndexValue[newObject.name()] = true;
          containerRef.$update(containerIndexValue);
          $scope.item = "";
        },function(err) {
          $scope.err = errMessage(err);
        });

      }

  }])

  .controller('ContainerCtrl', ['$scope', 'simpleLogin', 'fbutil', 'user', '$location', '$firebase',
    function($scope, simpleLogin, fbutil, user, $location, $firebase) {

      console.log('Logged in user ID: '+user.uid);

      var rootContainerFB = new Firebase("https://flickering-fire-3648.firebaseio.com/users/"+user.uid+"/root_containers");
      var rootContainer = $firebase(rootContainerFB).$asObject();
      var rootContainerName = "-JUApWC5RZF-LgQmoUxd";// For test
      var rootContainerId = rootContainer.$id;
      console.log('rootContainerId: '+rootContainerId);
      console.log('rootContainerName: '+rootContainerName);
      var userGroceryListFB = new Firebase("https://flickering-fire-3648.firebaseio.com/containers/"+rootContainerName+"/children");
      var userGroceryLists = $firebase(userGroceryListFB).$asArray();
      console.log("User has "+userGroceryLists.length+" lists.");
      $scope.userGroceryLists = $firebase(userGroceryListFB).$asArray();
      $scope.rootContainerName = rootContainerName;
      $scope.rootContainerId = rootContainerId;

      var gLs = {};

      for(var i=0; i<userGroceryLists.length; i++){
        //var listRef = $firebase(fbutil.ref('containers',userGroceryLists[i]));
        gLs[i] = $firebase(fbutil.ref('containers',userGroceryLists[i])).$asObject();
        console.log("list "+i+" name : "+listRef.name());
      }

      $scope.userGLs = gLs;

      // ******** Add Container - Start *********
      $scope.addList = function() {
        var containerRef = $firebase(fbutil.ref('containers'));
        var glRef = $firebase(fbutil.ref('containers', rootContainerName, 'children' ));

        var ownersObj = {};
        ownersObj[user.uid] = true;
        var groceryList = {
          owners: ownersObj,
          parent: $scope.parentName || $scope.rootContainerName,
          name: $scope.listName
        }

        containerRef.$push(groceryList).then(function(newObject) {
          var containerIndexValue = {};
          containerIndexValue[newObject.name()] = true;
          glRef.$update(containerIndexValue);
          $scope.containerName = '';
          console.log("Grocery list created : "+newObject.name());
        },function(err) {
          $scope.err = 'Grocery list creation failed.';
        });
      }

      }
  ])

  .controller('ExampleCtrl', ['$scope', 'simpleLogin', 'fbutil', 'user', '$location',
    function($scope, simpleLogin, fbutil, user, $location) {
    // example controller to show how to use some aspects of AngularFire

    $scope.dumpData = function(){
      console.log(user);
    };

    $scope.redirect = function(){
      $location.path('/home')
    };

  }])
  .controller('LogoutCtrl', ['$scope', 'simpleLogin', 'fbutil', '$location',
    function($scope, simpleLogin, fbutil, $location) {
      simpleLogin.logout();
      console.log('User logged out');
      $location.path('/login');
  }])
  .controller('LoginCtrl', ['$scope', 'simpleLogin','fbutil', '$location', 'FBURL', function($scope, simpleLogin, fbutil, $location, FBURL) {
    $scope.email = null;
    $scope.pass = null;
    $scope.confirm = null;
    $scope.createMode = false;

    $scope.login = function(email, pass) {
      $scope.err = null;
      simpleLogin.login(email, pass)
        .then(function(/* user */) {
          $location.path('/account');
        }, function(err) {
          $scope.err = errMessage(err);
        });
    };

    $scope.createAccount = function() {
      $scope.err = null;
      if( assertValidAccountProps() ) {
        simpleLogin.createAccount($scope.email, $scope.pass)
          .then(function(/* user */) {
            $location.path('/account');
          }, function(err) {
            $scope.err = errMessage(err);
          });
      }
    };

    function assertValidAccountProps() {
      if( !$scope.email ) {
        $scope.err = 'Please enter an email address';
      }
      else if( !$scope.pass || !$scope.confirm ) {
        $scope.err = 'Please enter a password';
      }
      else if( $scope.createMode && $scope.pass !== $scope.confirm ) {
        $scope.err = 'Passwords do not match';
      }
      return !$scope.err;
    }

    function errMessage(err) {
      return angular.isObject(err) && err.code? err.code : err + '';
    }
  }])

  .controller('AccountCtrl', ['$scope', 'simpleLogin', 'fbutil', 'user', '$location',
    function($scope, simpleLogin, fbutil, user, $location) {
      // create a 3-way binding with the user profile object in Firebase
      var profile = fbutil.syncObject(['users', user.uid]);
      profile.$bindTo($scope, 'profile');

      console.log(user);
      // expose logout function to scope
      /*$scope.logout = function() {
        console.log('%%%%%%%%%%%');
        profile.$destroy();
        console.log('***********');
        simpleLogin.logout();
        console.log('$$$$$$$$$$$');
        $location.path('/login');
      };*/

      $scope.changePassword = function(pass, confirm, newPass) {
        resetMessages();
        if( !pass || !confirm || !newPass ) {
          $scope.err = 'Please fill in all password fields';
        }
        else if( newPass !== confirm ) {
          $scope.err = 'New pass and confirm do not match';
        }
        else {
          simpleLogin.changePassword(profile.email, pass, newPass)
            .then(function() {
              $scope.msg = 'Password changed';
            }, function(err) {
              $scope.err = err;
            })
        }
      };

      $scope.clear = resetMessages;

      $scope.changeEmail = function(pass, newEmail) {
        resetMessages();
        profile.$destroy();
        simpleLogin.changeEmail(pass, newEmail)
          .then(function(user) {
            profile = fbutil.syncObject(['users', user.uid]);
            profile.$bindTo($scope, 'profile');
            $scope.emailmsg = 'Email changed';
          }, function(err) {
            $scope.emailerr = err;
          });
      };

      function resetMessages() {
        $scope.err = null;
        $scope.msg = null;
        $scope.emailerr = null;
        $scope.emailmsg = null;
      }
    }
  ]);

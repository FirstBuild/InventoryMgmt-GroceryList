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

      // ******** Add Container - Start *********

      //Add to containers
      //Add to users
      //Add to objects?



      $scope.addContainer = function() {
          $scope.containers.$add({
          		owner: user.uid,
          		parent: $scope.parentName,
            	name: $scope.containerName
          });
          $scope.containerName = '';
      }

      // ******** Add Container - End *********

      // ******** Add Object - Start *********

      $scope.addObject = function() {

      }

      // ******** Add Object - End *********


      // ******** View Container - Start *********

      // create a 3-way binding with the user profile object in Firebase
      //////var profile = fbutil.syncObject(['users', user.uid]);
      //var profile = fbutil.syncObject('user');
      /////profile.$bindTo($scope, 'profile');

      console.log('&&&&&&&&&&&&&&'+user.uid);

      var usersRef = new Firebase("https://flickering-fire-3648.firebaseio.com/users");
      var containersRef = new Firebase("https://flickering-fire-3648.firebaseio.com/containers");
      //var ownersRef = containersRef.child("owners").child(user.uid);
      //linkCommentsRef.on("child_added", function(snap) {
        //commentsRef.child(snap.name()).once("value", function() {
          // Render the comment on the link page.
        //));
      //});

      var ownersRef = containersRef.child("owners")
      .startAt(user.uid)
      .endAt(user.uid)
      .once('value', function(snap) {
        console.log('containers of user : ', snap.val())
      });

      //.startAt('/owners/'+user.uid)
      //.endAt('/owners/'+user.uid)
      //.once('value', function(snap) {
        //console.log('containers of user '+user.uid+ ': ', snap.val())
      //}

      //;
      $scope.containers = $firebase(ownersRef).$asArray();
      console.log($scope.containers);

      // ******** View Container - End *********
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

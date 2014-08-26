'use strict';

// Declare app level module which depends on filters, and services
angular.module('fbGroceryList', [
    'fbGroceryList.config',
    'fbGroceryList.controllers',
    'fbGroceryList.decorators',
    'fbGroceryList.directives',
    'fbGroceryList.filters',
    'fbGroceryList.routes',
    'fbGroceryList.services'
  ])

  .run(['simpleLogin', function(simpleLogin) {
    console.log('run'); //debug
    simpleLogin.getUser();
  }])

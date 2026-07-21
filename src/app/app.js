angular.module('app', [
  'ui.router',
  'ui.bootstrap',
  'ngAnimate',
  'templates'
])

.run(['$rootScope', '$window', '$state',
  function Execute($rootScope, $window, $state) {
    $rootScope.isDesktop = !!$window.process && !!$window.require;

    $rootScope.go = function(state, params) {
      $state.go(state, params);
    };
  }
])

.run(['$window', '$animate', '$http', '$state', '$location', '$document', '$timeout', 'settingsModel', 'projectModel',
  function Execute($window,
                   $animate,
                   $http,
                   $state,
                   $location,
                   $document,
                   $timeout,
                   settingsModel,
                   projectModel) {

    // reset path
    $location.path('/');

    // add drop to canvas
    angular
      .element($window.editor._game.canvas)
      .attr('b3-drop-node', true);

    // initialize editor
    settingsModel.getSettings();
    projectModel
      .getRecentProjects()
      .then(function(projects) {
        
        function closePreload() {
          $timeout(function() {
            var element = angular.element(document.getElementById('page-preload'));
            $animate.addClass(element, 'preload-fade')
              .then(function() {
                element.remove();
              });
          }, 500);
        }

        function loadExample() {
          var match = /[?&]example=([\w-]+)/.exec($window.location.search);
          if (!match) return;

          $http
            .get('examples/' + match[1] + '.json')
            .then(function(response) {
              var path = 'b3projects-examples';
              return projectModel
                .openProject(path)
                .then(null, function() {
                  return projectModel.newProject(path, 'Examples');
                })
                .then(function() {
                  var data = response.data;
                  if (data.trees) {
                    $window.editor.import.projectAsData(data);
                  } else {
                    $window.editor.import.treeAsData(data);
                  }
                  $window.editor.clearDirty();
                  $state.go('editor');
                });
            });
        }

        if (projects.length > 0 && projects[0].isOpen) {
          projectModel
            .openProject(projects[0].path)
            .then(null, function() {
              // A corrupt recent project must not block startup
            })
            .then(function() {
              closePreload();
              loadExample();
            });
        } else {
          closePreload();
          loadExample();
        }
      });
  }
]);

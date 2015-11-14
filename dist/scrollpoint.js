/*!
 * angular-ui-scrollpoint
 * https://github.com/angular-ui/ui-scrollpoint
 * Version: 1.3.0 - 2015-11-14T17:46:28.266Z
 * License: MIT
 */


(function () { 
'use strict';
/**
 * Adds a 'ui-scrollpoint' class to the element when the page scrolls past it's position.
 * @param [offset] {int} optional Y-offset to override the detected offset.
 *   Takes 300 (absolute) or -300 or +300 (relative to detected)
 */
angular.module('ui.scrollpoint', []).directive('uiScrollpoint', ['$window', function ($window) {

        function getWindowScrollTop() {
            if (angular.isDefined($window.pageYOffset)) {
                return $window.pageYOffset;
            } else {
                var iebody = (document.compatMode && document.compatMode !== 'BackCompat') ? document.documentElement : document.body;
                return iebody.scrollTop;
            }
        }
        return {
            require: '^?uiScrollpointTarget',
            scope: {
                uiScrollpoint: '@',
                uiScrollpointClass: '@?',
                uiScrollpointAction: '&?'
            },
            link: function (scope, elm, attrs, uiScrollpointTarget) {
                var absolute = true,
                    shift = 0,
                    past = false,
                    fixLimit,
                    $target = uiScrollpointTarget && uiScrollpointTarget.$element || angular.element($window);
                var scrollpointClass = scope.uiScrollpointClass || 'ui-scrollpoint';
                if(scope.uiScrollpointAction){
                    var action = scope.uiScrollpointAction();
                }
    
                function setup(scrollpoint) {
                    if (!scrollpoint) {
                        absolute = false;
                    } else if (typeof (scrollpoint) === 'string') {
                        // charAt is generally faster than indexOf: http://jsperf.com/indexof-vs-charat
                        if (scrollpoint.charAt(0) === '-') {
                            absolute = false;
                            shift = -parseFloat(scrollpoint.substr(1));
                        } else if (scrollpoint.charAt(0) === '+') {
                            absolute = false;
                            shift = parseFloat(scrollpoint.substr(1));
                        } else {
                            var parsed = parseFloat(scrollpoint);
                            if (!isNaN(parsed) && isFinite(parsed)) {
                                absolute = true;
                                shift = parsed;
                            }
                        }
                    } else if (typeof (scrollpoint) === 'number') {
                        setup(scrollpoint.toString());
                        return;
                    }
                    fixLimit = absolute ? scope.uiScrollpoint : elm[0].offsetTop + shift;
                }
                setup(scope.uiScrollpoint);
    
                function onScroll() {
    
                    var limit = absolute ? scope.uiScrollpoint : elm[0].offsetTop + shift;
    
                    // if pageYOffset is defined use it, otherwise use other crap for IE
                    var offset = uiScrollpointTarget ? $target[0].scrollTop : getWindowScrollTop();
                    var distance = null;
                    if (offset > limit) {
                        if(!past){
                            distance = limit - offset;
                            past = true;
                        }
                        if(!elm.hasClass(scrollpointClass)){
                            elm.addClass(scrollpointClass);
                        }
                        fixLimit = limit;
                    } else if (offset < fixLimit) {
                        if(past){
                            distance = fixLimit - offset;
                            past = false;
                        }
                        if(elm.hasClass(scrollpointClass)){
                            elm.removeClass(scrollpointClass);
                        }
                    }
                    if(action && distance !== null){
                        action(elm, distance);
                    }
                }
    
                function reset() {
                    elm.removeClass(scrollpointClass);
                    past = false;
                    fixLimit = absolute ? scope.uiScrollpoint : elm[0].offsetTop + shift;
                    onScroll();
                }
    
                scope.$on('scrollpointShouldReset', reset);
    
                $target.on('scroll', onScroll);
                onScroll(); // sets the initial state
    
                // Unbind scroll event handler when directive is removed
                scope.$on('$destroy', function () {
                    $target.off('scroll', onScroll);
                });
    
                scope.$watch('uiScrollpoint', function (newScrollpoint) {
                    setup(newScrollpoint);
                    onScroll();
                });
            }
        };
    }]).directive('uiScrollpointTarget', [function () {
        return {
            controller: ['$element', function ($element) {
                this.$element = $element;
            }]
        };
    }]);

}());
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
        function getWindowHeight(contentHeight) {
            return (contentHeight ? ($window.document.body.scrollHeight - $window.innerHeight) : $window.innerHeight);
        }
        return {
            require: ['uiScrollpoint', '^?uiScrollpointTarget'],
            scope: {
                uiScrollpoint: '@',
                uiScrollpointClass: '@?',
                uiScrollpointAction: '&?',
                uiScrollpointBottom: '@?'
            },
            controller: function(){
                this.absolute = true;
                this.percent = false;
                this.shift = 0;
                this.past = undefined;

                this.bottom = undefined;
                this.hasTarget = false;
                this.$target = undefined;
                this.scrollpointClass = 'ui-scrollpoint';
                this.actions = [];

                this.getScrollOffset = function(){
                    return this.hasTarget ? this.$target[0].scrollTop : getWindowScrollTop();
                };
            },
            link: function (scope, elm, attrs, Ctrl) {
                var uiScrollpoint = Ctrl[0];
                var uiScrollpointTarget = Ctrl[1];
                
                // configure controller with the attributes
                uiScrollpoint.bottom = scope.uiScrollpointBottom;
                uiScrollpoint.hasTarget = uiScrollpointTarget ? true : false;
                uiScrollpoint.$target = uiScrollpointTarget && uiScrollpointTarget.$element || angular.element($window);
                uiScrollpoint.scrollpointClass = scope.uiScrollpointClass || 'ui-scrollpoint';
                if(scope.uiScrollpointAction){
                    uiScrollpoint.actions.push(scope.uiScrollpointAction());
                }

                var fixLimit;

                function setup(scrollpoint) {
                    if (!scrollpoint) {
                        uiScrollpoint.absolute = false;
                    } else if (typeof (scrollpoint) === 'string') {
                        // charAt is generally faster than indexOf: http://jsperf.com/indexof-vs-charat
                        uiScrollpoint.percent = (scrollpoint.charAt(scrollpoint.length-1) == '%');
                        if(uiScrollpoint.percent){
                            scrollpoint = scrollpoint.substr(0, scrollpoint.length-1);
                        }
                        if (scrollpoint.charAt(0) === '-') {
                            uiScrollpoint.absolute = uiScrollpoint.percent;
                            uiScrollpoint.shift = -parseFloat(scrollpoint.substr(1));
                        } else if (scrollpoint.charAt(0) === '+') {
                            uiScrollpoint.absolute = uiScrollpoint.percent;
                            uiScrollpoint.shift = parseFloat(scrollpoint.substr(1));
                        } else {
                            var parsed = parseFloat(scrollpoint);
                            if (!isNaN(parsed) && isFinite(parsed)) {
                                uiScrollpoint.absolute = true;
                                uiScrollpoint.shift = parsed;
                            }
                        }
                    } else if (typeof (scrollpoint) === 'number') {
                        scrollpoint = scrollpoint.toString();
                        setup(scrollpoint);
                        return;
                    }
                    fixLimit = calcLimit();
                }
                setup(scope.uiScrollpoint);

                function calcLimit(){
                    var limit = uiScrollpoint.absolute ? uiScrollpoint.shift : calcElementTop() + uiScrollpoint.shift;
                    if(uiScrollpoint.percent && uiScrollpoint.absolute){
                        // percent only works in absolute mode (absolute mode is forced for %'s in setup())
                        limit = uiScrollpoint.shift / 100.0 * calcTargetContentHeight();
                        if(uiScrollpoint.bottom){
                            limit = calcTargetContentHeight() - limit;
                        }
                    }
                    else if(uiScrollpoint.bottom){
                        if(uiScrollpoint.absolute){
                            limit = calcTargetContentHeight() - limit;
                        }
                        else{
                            limit = limit + elm[0].offsetHeight+1 - calcTargetHeight();
                        }
                    }
                    return limit;
                }

                function calcElementTop(){
                    if(!uiScrollpointTarget){
                        var bounds = elm[0].getBoundingClientRect();
                        return bounds.top + getWindowScrollTop();
                    }
                    return elm[0].offsetTop;
                }
                function calcTargetHeight(){
                    return ( uiScrollpointTarget ? uiScrollpoint.$target[0].offsetHeight : getWindowHeight() );
                }
                function calcTargetContentHeight(){
                    return ( uiScrollpointTarget ? (uiScrollpoint.$target[0].scrollHeight - uiScrollpoint.$target[0].clientHeight) : getWindowHeight(true) );
                }
    
                function onScroll() {
                    var limit = calcLimit();
    
                    // if pageYOffset is defined use it, otherwise use other crap for IE
                    var offset = uiScrollpoint.getScrollOffset();
                    var distance = null;
                    var initCheck = angular.isUndefined(uiScrollpoint.past);
                    
                    if ((!uiScrollpoint.bottom && offset >= limit) || (uiScrollpoint.bottom && offset <= limit)) {
                        if(!uiScrollpoint.past){
                            distance = limit - offset;
                            uiScrollpoint.past = true;
                        }
                        if(!elm.hasClass(uiScrollpoint.scrollpointClass)){
                            elm.addClass(uiScrollpoint.scrollpointClass);
                        }
                        fixLimit = limit;
                    } else if ((!uiScrollpoint.bottom && offset < fixLimit) || (uiScrollpoint.bottom && offset > fixLimit)) {
                        if(uiScrollpoint.past || initCheck){
                            distance = fixLimit - offset;
                            uiScrollpoint.past = false;
                        }
                        if(elm.hasClass(uiScrollpoint.scrollpointClass)){
                            elm.removeClass(uiScrollpoint.scrollpointClass);
                        }
                    }
                    if(uiScrollpoint.actions && uiScrollpoint.actions.length && distance !== null){
                        if(!initCheck){
                            scope.$apply(function(){
                                for(var i in uiScrollpoint.actions){
                                    if(uiScrollpoint.actions[i] && angular.isFunction(uiScrollpoint.actions[i])){
                                        uiScrollpoint.actions[i](elm, distance * (uiScrollpoint.bottom?-1.0:1.0));
                                    }
                                }
                            });
                        }
                        else{
                         //   uiScrollpoint.action(elm, distance * (uiScrollpoint.bottom?-1.0:1.0));
                             for(var i in uiScrollpoint.actions){
                                 if(uiScrollpoint.actions[i] && angular.isFunction(uiScrollpoint.actions[i])){
                                     uiScrollpoint.actions[i](elm, distance * (uiScrollpoint.bottom?-1.0:1.0));
                                 }
                             }
                        }
                    }
                }
    
                function reset() {
                    elm.removeClass(uiScrollpoint.scrollpointClass);
                    uiScrollpoint.past = undefined;
                    fixLimit = calcLimit();
                    onScroll();
                }
    
                scope.$on('scrollpointShouldReset', reset);
    
                uiScrollpoint.$target.on('scroll', onScroll);
                elm.ready(onScroll); // sets the initial state
    
                // Unbind scroll event handler when directive is removed
                scope.$on('$destroy', function () {
                    uiScrollpoint.$target.off('scroll', onScroll);
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
    }]).directive('uiScrollpointPin', ['$compile', '$timeout', function ($compile, $timeout) {
        return {
            restrict: 'A',
            require: 'uiScrollpoint',
            transclude: true,
            link: function (scope, elm, attrs , uiScrollpoint, transclude){
                var pinned;
                var offset = 0;
                var origCss = {};

                // stash the un-interpolated innerHTML for when we create the pinned instance
                transclude(scope, function(clone, scope){
                    elm[0].srcHTML = clone[0].innerHTML;
                    elm.append($compile(clone)(scope));
                });

                // pinned positioning function
                function repositionPinned(){
                    if(pinned){
                        var scrollOffset = uiScrollpoint.getScrollOffset();
                        pinned.css('top', (scrollOffset-offset)+'px');
                    }
                }                

                // create a scrollpoint action that pins the element
                uiScrollpoint.actions.push( function(element, distance){
                    if(distance <= 0 && !pinned){
                        // PIN IT

                        // calculate the offset for its absolute positioning
                        offset = uiScrollpoint.getScrollOffset() - element[0].offsetTop + distance * (uiScrollpoint.bottom?-1.0:1.0);

                        // clone the element
                        pinned = element.clone();
                        if(element[0].srcHTML){
                            //pinned[0].innerHTML = element[0].srcHTML;
                        }
                        // remove all ui-scrollpoint attributes (original element handles the scrollpoint)
                        pinned.removeAttr('ui-scrollpoint');
                        pinned.removeAttr('ui-scrollpoint-action');
                        pinned.removeAttr('ui-scrollpoint-bottom');
                        pinned.removeAttr('ui-scrollpoint-class');
                        pinned.removeAttr('ui-scrollpoint-pin');

                        // absolute position and pinned
                        pinned.css('position', 'absolute');
                        pinned.addClass('pinned');

                        // hide the original and inject the pinned
                        origCss.visibility = element.css('visibility');
                        element.css('visibility', 'hidden');
                        element.after(pinned);

                        // listen for scroll events so we can recalculate the pinned position
                        uiScrollpoint.$target.on('scroll', repositionPinned);
                        repositionPinned();

                        // compile the pinned element so it has scope bindings
                        $compile(pinned)(scope);
                    }
                    else if(distance > 0 && pinned){
                        // UNPIN it

                        // show the original element
                        element.css('visibility', origCss.visibility);
                        
                        // remove the pinned version
                        pinned.remove();
                        pinned = undefined;

                        uiScrollpoint.$target.off('scroll', repositionPinned);
                    }
                });
            }
        };
    }]);

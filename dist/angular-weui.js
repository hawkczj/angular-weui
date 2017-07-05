(function() {

	// ng-weui-actionsheet	
	angular
		.module('ng-weui-actionsheet', [])
		.directive('weuiActionSheet', ['$document', function($document) {
			 return {
			    restrict: 'E',
			    scope: true,
			    replace: true,
			    template: 	'<div class="ng-weui-action-sheet-backdrop">'+
        						'<div class="weui-actionsheet">'+
					                '<div class="weui-actionsheet__menu">'+
					                	'<div class="weui-actionsheet__cell action-sheet-title" ng-if="titleText" ng-bind="titleText"></div>'+
					                	'<div class="weui-actionsheet__cell" ng-click="buttonClicked($index)" ng-repeat="b in buttons" ng-class="b.className" ng-bind="b.text"></div>'+
					                	'<div class="weui-actionsheet__cell destructive action-sheet-destructive" ng-if="destructiveText" ng-click="destructiveButtonClicked()" ng-bind="destructiveText"></div>'+
					                '</div>'+
					                '<div class="weui-actionsheet__action" ng-if="cancelText">'+
					                	'<div class="weui-actionsheet__cell" ng-click="cancel()" ng-bind="cancelText"></div>'+
					                '</div>'+
				                '</div>'+
			                '</div>',
			    link: function($scope, $element) {
					var keyUp = function(e) {
						if (e.which == 27) {
							$scope.cancel();
							$scope.$apply();
						}
					};

					var backdropClick = function(e) {
						if (e.target == $element[0]) {
							$scope.cancel();
							$scope.$apply();
						}
					};

					$scope.$on('$destroy', function() {
						$element.remove();
						$document.unbind('keyup', keyUp);
					});

					$document.bind('keyup', keyUp);
					$element.bind('click', backdropClick);
			    }
			}
		}])
		.provider('$weuiActionSheet', function () {
	        var defaults = this.defaults = {
	        	titleText: undefined,
				buttons: [],
				buttonClicked: angular.noop,
				cancelText: '取消',
				cancel: angular.noop,
				// destructiveText: '删除',
				// destructiveButtonClicked: angular.noop,
				cancelOnStateChange: true
	        }

	        this.$get = ['$document', '$templateCache', '$compile', '$q', '$http', '$rootScope', '$timeout', '$window', '$controller', '$injector',
            function ($document, $templateCache, $compile, $q, $http, $rootScope, $timeout, $window, $controller, $injector) {
	        	var self   = this,
					$el    = angular.element,
					$body  = $el(document.body),
					extend = angular.extend,
					noop   = angular.noop,
					copy   = angular.copy;

	        	var privateMethods = {

	        	}

	        	var publicMethods = {
	        		show: function(opts) {
						var scope = $rootScope.$new(true);

						extend(scope, copy(defaults), opts || {});

					    var element = scope.element = $compile('<weui-action-sheet></weui-action-sheet>')(scope);
					    var sheetEl = $el(element[0].querySelector('.weui-actionsheet'));

					    var stateChangeListenDone = scope.cancelOnStateChange ? $rootScope.$on('$stateChangeSuccess', function() { scope.cancel(); }) : noop;

					    $body.append(element);

					    scope.showSheet = function(callback) {
					    	if (scope.removed) return;
					    	element[0].offsetWidth;
							element.addClass('active');
							sheetEl.addClass('weui-actionsheet_toggle');
					    }

					    scope.removeSheet = function(callback) {
					    	if (scope.removed) return;
					    	scope.removed = true;
							sheetEl.removeClass('weui-actionsheet_toggle');
							element.removeClass('active');
							stateChangeListenDone();
							element.on('transitionend', function() {
								element.remove();
								scope.cancel.$scope = element = null;
								(callback || noop)(opts.buttons);
							})
						}

						scope.buttonClicked = function(index) {
							if (opts.buttonClicked(index, opts.buttons[index]) === true) {
								scope.removeSheet();
							}
						}

						scope.destructiveButtonClicked = function() {
							if (opts.destructiveButtonClicked() === true) {
								scope.removeSheet();
							}
						}

						scope.cancel = function() {
							scope.removeSheet(opts.cancel);
						}

						scope.showSheet();
						scope.cancel.$scope = scope;
						return scope.cancel;
	        		}
	        	}
	        	
	        	return publicMethods;
	        }]

	        this.setDefaults = function (newDefaults) {
	            angular.extend(defaults, newDefaults);
	        }
	    })
	
})(); 
(function() {

	// ng-weui-backdrop	
	angular
		.module('ng-weui-backdrop', [])
		.provider('$weuiBackdrop', function () {
	        this.$get = ['$document', '$timeout', '$$rAF', '$rootScope', 
            function ($document, $timeout, $$rAF, $rootScope) {
	        	var self   = this,
					$el    = angular.element,
					$body  = $el(document.body),
					extend = angular.extend,
					noop   = angular.noop,
					copy   = angular.copy;

	        	var privateMethods = {
	        		backdropHolds: 0,
	        		_el: $el('<div class="weui-mask hidden"></div>'),
	        		_init: function() {
	        			$body.append(privateMethods._el)
	        		}
	        	}

	        	var publicMethods = {
	        		getElement: function() {
	        			return privateMethods._el
	        		},
	        		retain: function() {
						privateMethods.backdropHolds++;
						if (privateMethods.backdropHolds === 1) {
							privateMethods._el.addClass('visible');
							$rootScope.$broadcast('backdrop.shown');
							$$rAF(function() {
								if (privateMethods.backdropHolds >= 1) privateMethods._el.addClass('active');
							});
						}
	        		},
	        		release: function() {
						if (privateMethods.backdropHolds === 1) {
							privateMethods._el.removeClass('active');
							$rootScope.$broadcast('backdrop.hidden');
							$timeout(function() {
								if (privateMethods.backdropHolds === 0) privateMethods._el.removeClass('visible');
							}, 400, false);
						}
						privateMethods.backdropHolds = Math.max(0, privateMethods.backdropHolds - 1);
	        		}
	        	}

	        	privateMethods._init();
	        	
	        	return publicMethods;
	        }]
	    })
	
})(); 
// Events
// -----------------
// Thanks to:
//  - https://github.com/documentcloud/backbone/blob/master/backbone.js
//  - https://github.com/joyent/node/blob/master/lib/events.js

// Regular expression used to split event strings

var eventSplitter = /\s+/;

// A module that can be mixed in to *any object* in order to provide it
// with custom events. You may bind with `on` or remove with `off` callback
// functions to an event; `trigger`-ing an event fires all callbacks in
// succession.
//
// var object = new Events();
// object.on('expand', function(){ alert('expanded'); });
// object.trigger('expand');
//

function Events() {}

// Bind one or more space separated events, `events`, to a `callback`
// function. Passing `"all"` will bind the callback to all events fired.
Events.prototype.on = function(events, callback, context) {
	var cache, event, list;
	if (!callback) return this;

	cache = this.__events || (this.__events = {});
	events = events.split(eventSplitter);
	while (event = events.shift()) {
		// eslint-disable-line
		list = cache[event] || (cache[event] = []);
		list.push(callback, context);
	}

	return this;
};

Events.prototype.once = function(events, callback, context) {
	var that = this;
	var cb = function cb() {
			that.off(events, cb);
			callback.apply(context || that, arguments);
		};
	return this.on(events, cb, context);
};

// Remove one or many callbacks. If `context` is null, removes all callbacks
// with that function. If `callback` is null, removes all callbacks for the
// event. If `events` is null, removes all bound callbacks for all events.
Events.prototype.off = function(events, callback, context) {
	var cache, event, list, i;

	// No events, or removing *all* events.
	if (!(cache = this.__events)) return this;
	if (!(events || callback || context)) {
		delete this.__events;
		return this;
	}

	events = events ? events.split(eventSplitter) : keys(cache);

	// Loop through the callback list, splicing where appropriate.
	while (event = events.shift()) {
		// eslint-disable-line
		list = cache[event];
		if (!list) continue;

		if (!(callback || context)) {
			delete cache[event];
			continue;
		}

		for (i = list.length - 2; i >= 0; i -= 2) {
			if (!(callback && list[i] !== callback || context && list[i + 1] !== context)) {
				list.splice(i, 2);
			}
		}
	}

	return this;
};

// Trigger one or many events, firing all bound callbacks. Callbacks are
// passed the same arguments as `trigger` is, apart from the event name
// (unless you're listening on `"all"`, which will cause your callback to
// receive the true name of the event as the first argument).
Events.prototype.trigger = function(events) {
	var cache, event, all, list, i, len;
	var rest = [];
	var returned = true;
	if (!(cache = this.__events)) return this;

	events = events.split(eventSplitter);

	// Fill up `rest` with the callback arguments.  Since we're only copying
	// the tail of `arguments`, a loop is much faster than Array#slice.
	for (i = 1, len = arguments.length; i < len; i++) {
		rest[i - 1] = arguments[i];
	}

	// For each event, walk through the list of callbacks twice, first to
	// trigger the event, then to trigger any `"all"` callbacks.
	while (event = events.shift()) {
		// eslint-disable-line
		// Copy callback lists to prevent modification.
		if (all = cache.all) all = all.slice(); // eslint-disable-line
		if (list = cache[event]) list = list.slice(); // eslint-disable-line

		// Execute event callbacks except one named "all"
		if (event !== 'all') {
			returned = triggerEvents(list, rest, this) && returned;
		}

		// Execute "all" callbacks.
		returned = triggerEvents(all, [event].concat(rest), this) && returned;
	}

	return returned;
};

Events.prototype.emit = Events.prototype.trigger;

// Helpers
// -------

var keys = Object.keys;

if (!keys) {
	keys = function(o) {
		var result = [];

		for (var name in o) {
			if (o.hasOwnProperty(name)) {
				result.push(name);
			}
		}
		return result;
	};
}

// Mix `Events` to object instance or Class function.
Events.mixTo = function(receiver) {
	var proto = Events.prototype;

	if (isFunction(receiver)) {
		for (var key in proto) {
			if (proto.hasOwnProperty(key)) {
				receiver.prototype[key] = proto[key];
			}
		}
	} else {
		var event = new Events();
		for (var key in proto) {
			if (proto.hasOwnProperty(key)) {
				copyProto(key);
			}
		}
	}

	function copyProto(key) {
		receiver[key] = function() {
			proto[key].apply(event, Array.prototype.slice.call(arguments));
			return this;
		};
	}
};

// Execute callbacks

function triggerEvents(list, args, context) {
	var pass = true;

	if (list) {
		var i = 0;
		var l = list.length;
		var a1 = args[0];
		var a2 = args[1];
		var a3 = args[2];
		// call is faster than apply, optimize less than 3 argu
		// http://blog.csdn.net/zhengyinhui100/article/details/7837127
		switch (args.length) {
		case 0:
			for (; i < l; i += 2) {
				pass = list[i].call(list[i + 1] || context) !== false && pass;
			}
			break;
		case 1:
			for (; i < l; i += 2) {
				pass = list[i].call(list[i + 1] || context, a1) !== false && pass;
			}
			break;
		case 2:
			for (; i < l; i += 2) {
				pass = list[i].call(list[i + 1] || context, a1, a2) !== false && pass;
			}
			break;
		case 3:
			for (; i < l; i += 2) {
				pass = list[i].call(list[i + 1] || context, a1, a2, a3) !== false && pass;
			}
			break;
		default:
			for (; i < l; i += 2) {
				pass = list[i].apply(list[i + 1] || context, args) !== false && pass;
			}
			break;
		}
	}
	// trigger will return false if one of the callbacks return false
	return pass;
}

function isFunction(func) {
	return Object.prototype.toString.call(func) === '[object Function]';
}

/* Image Blur plugin, author @msurguy

 Usage:

 Create a set of elements that follows the following HTML structure:

 <div class="container">
   <div class="content">
   ...
   </div>
 </div>

 Add the following css:

 .container {
   overflow: hidden
   width: 100%
   position: relative
 }

 .container .bg-blur-overlay {
   z-index: -1
   position: absolute
   width: 100%
   height: 100%
   background-image: url('data:image/svg+xmlbase64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4gPHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkIiBncmFkaWVudFVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCIgeDE9IjAuNSIgeTE9IjAuMCIgeDI9IjAuNSIgeTI9IjEuMCI+PHN0b3Agb2Zmc2V0PSI0NiUiIHN0b3AtY29sb3I9IiMwMDAwMDAiIHN0b3Atb3BhY2l0eT0iMC4wOCIvPjxzdG9wIG9mZnNldD0iNTklIiBzdG9wLWNvbG9yPSIjMDAwMDAwIiBzdG9wLW9wYWNpdHk9IjAuMDgiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwMDAwMDAiIHN0b3Atb3BhY2l0eT0iMC45Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmFkKSIgLz48L3N2Zz4g')
   background-size: 100%
   background-image: -webkit-gradient(linear, 50% 0%, 50% 100%, color-stop(46%, rgba(0, 0, 0, 0.08)), color-stop(59%, rgba(0, 0, 0, 0.08)), color-stop(100%, rgba(0, 0, 0, 0.9)))
   background-image: -moz-linear-gradient(top, rgba(0, 0, 0, 0.08) 46%, rgba(0, 0, 0, 0.08) 59%, rgba(0, 0, 0, 0.9) 100%)
   background-image: -webkit-linear-gradient(top, rgba(0, 0, 0, 0.08) 46%, rgba(0, 0, 0, 0.08) 59%, rgba(0, 0, 0, 0.9) 100%)
   background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 46%, rgba(0, 0, 0, 0.08) 59%, rgba(0, 0, 0, 0.9) 100%)
 }

 .container .bg-blur {
   z-index: -2
   opacity: 0
   position: absolute
   width: 100%
   min-height: 100%
   height: auto
   display: block
   top: 0
   left: 0
 }

 .container .content {
  z-index: 1
 }

 */

// Random ID generator
var randomID = function randomID() {
		return '_' + Math.random().toString(36).substr(2, 9);
	};

// micro lib that creates SVG elements and adds attributes to it
var SVG = {

	// namespaces
	svgns: 'http://www.w3.org/2000/svg',
	xlink: 'http://www.w3.org/1999/xlink',

	// creating of SVG element
	createElement: function createElement(name, attrs) {
		var element = document.createElementNS(SVG.svgns, name);
		if (attrs) {
			SVG.setAttr(element, attrs);
		}
		return element;
	},

	// setting attributes
	setAttr: function setAttr(element, attrs) {
		for (var i in attrs) {
			if (i === 'href') {
				// path of an image should be stored as xlink:href attribute
				element.setAttributeNS(SVG.xlink, i, attrs[i]);
			} else {
				// other common attribute
				element.setAttribute(i, attrs[i]);
			}
		}
		return element;
	}
};

// backgroundBlur PUBLIC CLASS DEFINITION
// ================================

var Blur = function Blur(element, options) {
		this.internalID = randomID();
		this.element = element;
		this.width = element.offsetWidth;
		this.height = element.offsetHeight;
		this.element = element;
		this.parent = this.element.parentNode;
		this.options = Object.assign({}, Blur.DEFAULTS, options);
		this.overlayEl = this.createOverlay();
		this.blurredImage = null;
		this.attachListeners();
		this.generateBlurredImage(this.options.url);
	};

Blur.VERSION = '0.0.1';

Events.mixTo(Blur);

Blur.DEFAULTS = {
	url: '',
	// URL to the image
	blurAmount: 10,
	// Amount of blurrines
	imageClass: '',
	// CSS class that will be applied to the image and to the SVG element,
	overlayClass: '',
	// CSS class of the element that will overlay the blur image
	duration: false,
	// If the image needs to be faded in, how long should that take
	opacity: 1 // Specify the final opacity
};

Blur.prototype.setBlurAmount = function(blurAmount) {
	this.options.blurAmount = blurAmount;
};

Blur.prototype.attachListeners = function() {
	this.on('weui.blur.loaded', this.fadeIn.bind(this));
	this.on('weui.blur.unload', this.fadeOut.bind(this));
};

Blur.prototype.fadeIn = function() {};

Blur.prototype.fadeOut = function() {};

Blur.prototype.generateBlurredImage = function(url) {
	var previousImage = this.blurredImage;
	this.internalID = randomID();

	if (previousImage) {
		previousImage.parentNode.removeChild(previousImage);
	}

	this.blurredImage = this.createSVG(url, this.width, this.height);
};

Blur.prototype.createOverlay = function() {
	if (this.options.overlayClass && this.options.overlayClass !== '') {
		var div = document.createElement('div');
		div.classList.add(this.options.overlayClass);
		this.parent.insertBefore(div, this.element);
		return div;
	}

	return false;
};

Blur.prototype.createSVG = function(url, width, height) {
	var that = this;
	var svg = SVG.createElement('svg', { // our SVG element
		xmlns: SVG.svgns,
		version: '1.1',
		width: width,
		height: height,
		id: 'blurred' + this.internalID,
		'class': this.options.imageClass,
		viewBox: '0 0 ' + width + ' ' + height,
		preserveAspectRatio: 'none'
	});

	var filterId = 'blur' + this.internalID; // id of the filter that is called by image element
	var filter = SVG.createElement('filter', { // filter
		id: filterId
	});

	var gaussianBlur = SVG.createElement('feGaussianBlur', { // gaussian blur element
		'in': 'SourceGraphic',
		// "in" is keyword. Opera generates an error if we don't put quotes
		stdDeviation: this.options.blurAmount // intensity of blur
	});

	var image = SVG.createElement('image', { // The image that uses the filter of blur
		x: 0,
		y: 0,
		width: width,
		height: height,
		'externalResourcesRequired': 'true',
		href: url,
		style: 'filter:url(#' + filterId + ')',
		// filter link
		preserveAspectRatio: 'none'
	});

	image.addEventListener('load', function() {
		that.emit('weui.blur.loaded');
	}, true);

	image.addEventListener('SVGLoad', function() {
		that.emit('weui.blur.loaded');
	}, true);

	filter.appendChild(gaussianBlur); // adding the element of blur into the element of filter
	svg.appendChild(filter); // adding the filter into the SVG
	svg.appendChild(image); // adding an element of an image into the SVG

	// Ensure that the image is shown after duration + 100 msec in case the SVG load event didn't fire or took too long
	if (that.options.duration && that.options.duration > 0) {
		svg.style.opacity = 0;
		window.setTimeout(function() {
			if (getStyle(svg, 'opacity') === '0') {
				svg.style.opacity = 1;
			}
		}, this.options.duration + 100);
	}
	this.element.insertBefore(svg, this.element.firstChild);
	return svg;
};

Blur.prototype.createIMG = function(url, width, height) {
	var that = this;
	var originalImage = this.prependImage(url);
	var newBlurAmount = this.options.blurAmount * 2 > 100 ? 100 : this.options.blurAmount * 2;
	// apply special CSS attributes to the image to blur it
	var styles = {
		// filter property here the intensity of blur multipied by two is around equal to the intensity in common browsers.
		filter: 'progid:DXImageTransform.Microsoft.Blur(pixelradius=' + newBlurAmount + ') ',
		// aligning of the blurred image by vertical and horizontal
		top: -this.options.blurAmount * 2.5,
		left: -this.options.blurAmount * 2.5,
		width: width + this.options.blurAmount * 2.5,
		height: height + this.options.blurAmount * 2.5
	};
	for (var i in styles) {
		originalImage.style[i] = styles[i];
	}
	originalImage.setAttribute('id', this.internalID);

	originalImage.onload = function() {
		that.trigger('weui.blur.loaded');
	};
	// Ensure that the image is shown after duration + 100 msec in case the image load event didn't fire or took too long
	if (this.options.duration && this.options.duration > 0) {
		window.setTimeout(function() {
			if (getStyle(originalImage, 'opacity') === '0') {
				originalImage.style.opacity = 1;
			}
		}, this.options.duration + 100);
	}
	return originalImage;
};

Blur.prototype.prependImage = function(url) {
	var img = document.createElement('img');
	img.url = url;
	img.setAttribute('id', this.internalID);
	img.classList.add(this.options.imageClass);
	if (this.overlayEl) {
		this.parent.insertBefore(img, this.overlayEl);
	} else {
		this.parent.insertBefore(img, this.parent.firstChild);
	}
	return img;
};

function getStyle(ele, prop) {
	return window.getComputedStyle(ele, null).getPropertyValue(prop);
}

;(function() {

	// ng-weui-blur	
	angular
		.module('ng-weui-blur', [])
		.directive('weuiBlur', ['$rootScope', function($rootScope) {
			return {
				restrict: 'E',
				scope: {
					url: '@',
					blurAmount: '@',
					imageClass: '@',
					overlayClass: '@',
					duration: '@',
					opacity: '@',
				},
				template: '<div ng-transclude></div>',
				replace: true,
				transclude: true,
				link: function link($scope, $element, $attrs, ctrl) {
					var _blur = new Blur($element[0], {
						url: $scope.url,
						blurAmount: Number($scope.blurAmount) || 10,
						imageClass: $scope.imageClass || 'weui-bg-blur',
						overlayClass: $scope.overlayClass || 'weui-bg-overlay',
						duration: Number($scope.duration) || 100,
						opacity: Number($scope.opacity) || 1
					});
					$rootScope.$emit('weui-blur', _blur)
				}
			};
		}]);
})();
(function() {

	// ng-weui-checkbox	
	angular
		.module('ng-weui-checkbox', [])
		.directive('weuiCheckboxGroup', function(){
			return {
				scope: {
					viewText: '@',
					viewMore: '&'
				},
				restrict: 'E',
				template:   '<div class="weui-cells weui-cells_checkbox">'+
								'<div class="weui-checkbox__bd" ng-transclude></div>'+
								'<div class="weui-checkbox__ft" ng-if="show">'+
									'<a href="javascript:void(0);" class="weui-cell weui-cell_link" ng-click="viewMore()">'+
						                '<div class="weui-cell__bd" ng-bind="viewText"></div>'+
						            '</a>'+
								'</div>'+
							'</div>',
				replace: true,
				transclude: true,
				link: function($scope, iElm, iAttrs, controller) {
					$scope.viewText = $scope.viewText || '添加更多';
					$scope.show = !!iAttrs.viewMore && angular.isFunction($scope.viewMore);
				}
			};
		})
		.directive('weuiCheckbox', function(){
			return {
				restrict: 'E',
				replace: true,
				require: '?ngModel',
				transclude: true,
				template: 	'<label class="weui-cell weui-check__label">'+
								'<div class="weui-cell__hd">'+
				                    '<input type="checkbox" name="checkbox" class="weui-check">'+
				                    '<i class="weui-icon-checked"></i>'+
				                '</div>'+
				                '<div class="weui-cell__bd">'+
				                    '<p ng-transclude></p>'+
				                '</div>'+
							'</label>',

				compile: function(element, attr) {
					var input = element.find('input');
					
					angular.forEach({
						'name': attr.name,
						'ng-value': attr.ngValue,
						'ng-model': attr.ngModel,
						'ng-checked': attr.ngChecked,
						'ng-disabled': attr.ngDisabled,
						'ng-true-value': attr.ngTrueValue,
						'ng-false-value': attr.ngFalseValue,
						'ng-change': attr.ngChange,
						'ng-required': attr.ngRequired,
						'required': attr.required
					}, function(value, name) {
						if (angular.isDefined(value)) {
							input.attr(name, value);
						}
					});
				}
			};
		})
	
})(); 
(function() {

	// ng-weui-dialog	
	angular
		.module('ng-weui-dialog', [])
		.directive('weuiDialog', ['$document', function($document) {
			 return {
			    restrict: 'E',
			    scope: true,
			    replace: true,
			    template: 	'<div class="ng-weui-dialog-wrapper hidden">'+
						        '<div class="weui-dialog">'+
						            '<div class="weui-dialog__hd"><strong class="weui-dialog__title" ng-bind="title"></strong></div>'+
						            '<div class="weui-dialog__bd" ng-bind="text"></div>'+
						            '<div class="weui-dialog__ft">'+
						                '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_default" ng-if="cancelText" ng-click="cancel()" ng-bind="cancelText"></a>'+
						                '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary" ng-click="confirm()" ng-bind="confirmText"></a>'+
						            '</div>'+
						       '</div>'+
						    '</div>',
			    link: function($scope, $element) {
					var keyUp = function(e) {
						if (e.which == 27) {
							$scope.cancel();
							$scope.$apply();
						}
					};

					$scope.$on('$destroy', function() {
						$element.remove();
						$document.unbind('keyup', keyUp);
					});

					$document.bind('keyup', keyUp);
			    }
			}
		}])
		.provider('$weuiDialog', function () {
	        var defaults = this.defaults = {
	            className: undefined,
	            title: undefined,
	            text: undefined,
	            bodyClassName: 'ng-weui-dialog-open',
	            cancelText: '取消',
	            cancel: angular.noop,
	            confirmText: '确定',
	            confirm: angular.noop
	        }

	        this.$get = ['$document', '$templateCache', '$compile', '$q', '$http', '$rootScope', '$timeout', '$window', '$controller', '$weuiBackdrop',
            function ($document, $templateCache, $compile, $q, $http, $rootScope, $timeout, $window, $controller, $weuiBackdrop) {
	        	var self   = this,
					$el    = angular.element,
					$body  = $el(document.body),
					extend = angular.extend,
					noop   = angular.noop,
					copy   = angular.copy;

	        	var privateMethods = {

	        	}

	        	var publicMethods = {
	        		open: function(opts) {
	        			var scope = $rootScope.$new(true);

						extend(scope, copy(defaults), opts || {});

					    var element = scope.element = $compile('<weui-dialog></weui-dialog>')(scope);

					    $body.addClass(scope.bodyClassName).append(element);

					    scope.showDialog = function(callback) {
					    	if (scope.removed) return;
					    	$weuiBackdrop.retain();
					    	var $backdrop = $weuiBackdrop.getElement()
					    	$backdrop.addClass('backdrop-dialog');
					    	$backdrop.off().on('click', function(e) {
					    		if ($backdrop.hasClass('backdrop-dialog')) {
					    			scope.cancel()
					    		}
					    	})
							element.addClass('visible');
					    	element[0].offsetWidth;
							element.addClass('active');
					    }

					    scope.removeDialog = function(callback) {
					    	if (scope.removed) return;
					    	scope.removed = true;
					    	$weuiBackdrop.release()
					    	$weuiBackdrop.getElement().removeClass('backdrop-dialog')
							element.removeClass('active');
							element.on('transitionend', function() {
								element.remove();
								scope.$destroy();
								scope.cancel.$scope = element = null;
								(callback || noop)();
							})
						}

						scope.cancel = function() {
							scope.removeDialog(opts.cancel);
						}

						scope.confirm = function() {
							scope.removeDialog(opts.confirm);
						}

						scope.showDialog();
						scope.cancel.$scope = scope;
						return scope.cancel;
	        		}
	        	}
	        	
	        	return publicMethods
	        }]

	        this.setDefaults = function (newDefaults) {
	            angular.extend(defaults, newDefaults);
	        }
	    })
	
})(); 
(function() {

	// ng-weui-fileUpload	
	angular
		.module('ng-weui-fileUpload', [])
		.factory('$weuiFileReader', ['$q', function ($q) {
	        var onLoad = function(reader, deferred, scope) {
		        return function () {
		            scope.$apply(function () {
		                deferred.resolve(reader.result);
		            });
		        };
		    };

		    var onError = function (reader, deferred, scope) {
		        return function () {
		            scope.$apply(function () {
		                deferred.reject(reader.result);
		            });
		        };
		    };

		    var getReader = function(deferred, scope) {
		        var reader = new FileReader();
		        reader.onload = onLoad(reader, deferred, scope);
		        reader.onerror = onError(reader, deferred, scope);
		        return reader;
		    };

		    var readAsDataURL = function (file, scope) {
		        var deferred = $q.defer();
		        var reader = getReader(deferred, scope);         
		        reader.readAsDataURL(file);
		        return deferred.promise;
		    };

		    return {
		        readAsDataUrl: readAsDataURL  
		    };
	    }])
		.provider('$weuiFileOptimization', function () {
			var defaults = this.defaults = {
	        	maxWidth: 640,
	            maxHeight: 640,
	        }

	        this.$get = ['$q', '$http', function ($q, $http) {
	        	var self  = this;
	        	var privateMethods = {
	        		dataURItoBlob: function(dataURI) {
	        			// convert base64/URLEncoded data component to raw binary data held in a string
			            var byteString
			            if (dataURI.split(',')[0].indexOf('base64') >= 0){
			                byteString = atob(dataURI.split(',')[1])
			            } else {
			                byteString = unescape(dataURI.split(',')[1])
			            }

			            // separate out the mime component
			            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

			            // write the bytes of the string to a typed array
			            var ia = new Uint8Array(byteString.length)
			            for (var i = 0; i < byteString.length; i++) {
			                ia[i] = byteString.charCodeAt(i)
			            }

			            return new Blob([ia], {
			                type: mimeString
			            })
	        		},
	        		resizeFile: function(file, opts) {
	        			var deferred = $q.defer()
			            var img      = document.createElement("img")
			            var opts	 = opts || {}
			            var options  = angular.extend(angular.copy(defaults), opts)

			            try {
			                var reader = new FileReader()
			                reader.onload = function(e) {
			                    img.src = e.target.result

			                    //resize the image using canvas
			                    var canvas = document.createElement("canvas")
			                    var ctx    = canvas.getContext("2d")
			                    ctx.drawImage(img, 0, 0)

			                    var MAX_WIDTH  = options.maxWidth
			                    var MAX_HEIGHT = options.maxHeight
			                    var width      = img.width
			                    var height     = img.height
			                    if (width > height) {
			                        if (width > MAX_WIDTH) {
			                            height *= MAX_WIDTH / width
			                            width  = MAX_WIDTH
			                        }
			                    } else {
			                        if (height > MAX_HEIGHT) {
			                            width  *= MAX_HEIGHT / height
			                            height = MAX_HEIGHT
			                        }
			                    }
			                    canvas.width  = width
			                    canvas.height = height

			                    var ctx = canvas.getContext("2d")
			                    ctx.drawImage(img, 0, 0, width, height)

			                    //change the dataUrl to blob data for uploading to server
			                    var dataURL = canvas.toDataURL('image/jpeg')
			                    var data    = {}

			                    data.base64 = dataURL
			                    data.blob   = privateMethods.dataURItoBlob(dataURL)
			                    
			                    deferred.resolve(data)
			                }
			                reader.readAsDataURL(file)
			            } catch (e) {
			                deferred.resolve(e)
			            }

			            return deferred.promise
	        		}
	        	}

	        	return {
		            resizeFile: privateMethods.resizeFile
		        }
	        }]

	        this.setDefaults = function (newDefaults) {
	            angular.extend(defaults, newDefaults);
	        }
		})
		.directive('weuiFileModel', ['$parse', '$compile', function($parse, $compile){
			return {
				restrict: 'A',
				link: function(scope, element, attrs, ngModel) {
			        var model       = $parse(attrs.weuiFileModel),
			            modelSetter = model.assign;
			        element.bind('change', function(event){
			            scope.$apply(function(){
			                modelSetter(scope, element[0].files[0]);
			            });
			            //附件预览
			            scope.file = (event.srcElement || event.target).files[0];
			            scope.$apply(attrs.fileFn);
			            //清空文件上传域
			            _replaceNode(element);
			        });
			        function _replaceNode(input) {
			        	var clone = $compile(input.clone().val(''))(scope);
			        	input.after(clone);
		            	input.remove();
			        }
			    }
			};
		}])
	
})(); 
(function() {

	// ng-weui-gallery	
	angular
		.module('ng-weui-gallery', [])
		.provider('$weuiGallery', function () {
	        var defaults = this.defaults = {
	        	urls: [],
	        	index: 0,
	        	cancel: angular.noop,
	        	delete: angular.noop,
	        	animation: 'fade-in'
	        }

	        this.$get = ['$document', '$templateCache', '$compile', '$q', '$http', '$rootScope', '$timeout', '$window', '$controller', '$injector',
            function ($document, $templateCache, $compile, $q, $http, $rootScope, $timeout, $window, $controller, $injector) {
	        	var self   = this,
					$el    = angular.element,
					$body  = $el(document.body),
					extend = angular.extend,
					noop   = angular.noop,
					copy   = angular.copy;

	        	var privateMethods = {
	        		
	        	}

	        	var publicMethods = {
	        		show: function(opts) {
	        			var scope = $rootScope.$new(true);

	        			extend(scope, copy(defaults), opts || {});

	        			var element = scope.element = $compile('<weui-slide-box show-pager="false" active-slide="index" class="weui-gallery-wrapper">'+
				    			'<weui-slide ng-repeat="item in urls track by $index">'+
					    			'<div class="weui-gallery">'+
							            '<span class="weui-gallery__img" style="background-image:url({{item}})" ng-click="cancel()"></span>'+
							            '<div class="weui-gallery__opr">'+
							                '<a href="javascript:" class="weui-gallery__del" ng-click="delete($index)">'+
							                    '<i class="weui-icon-delete weui-icon_gallery-delete"></i>'+
							                '</a>'+
							            '</div>'+
							        '</div>'+
						        '</<weui-slide>'+
					        '</weui-slide-box>')(scope);
	        			
	        			element.addClass(scope.animation);
	        			$body.append(element);
	        			
	        			scope.show = function(callback) {
					    	if (scope.removed) return;
					    	element.addClass('ng-enter active').removeClass('ng-leave ng-leave-active');
					    	element[0].offsetWidth;
							element.addClass('ng-enter-active');
					    }

	        			scope.remove = function(callback) {
					    	if (scope.removed) return;
					    	scope.removed = true;
					    	element.addClass('ng-leave ng-leave-active').removeClass('ng-enter ng-enter-active active');
							element.on('transitionend', function() {
								element.remove();
								scope.cancel.$scope = element = null;
								(callback || noop)(opts.urls);
							})
						}

	        			scope.cancel = function() {
							scope.remove(opts.cancel);
						}

						scope.delete = function(index) {
							if (opts.delete(index, opts.urls[index]) === true) {
								scope.remove();
							}
						}

						scope.show();
						scope.cancel.$scope = scope;
						return scope.cancel;
	        		}
	        	}
	        	
	        	return publicMethods
	        }]

	        this.setDefaults = function (newDefaults) {
	            angular.extend(defaults, newDefaults);
	        }
	    })
	
})(); 
(function() {

	// ng-weui-icon	
	angular
		.module('ng-weui-icon', [])
		.directive('weuiIcon', function(){
			return {
				restrict: 'E',
				template: '<i></i>',
				replace: true,
				link: function($scope, $element, $attrs, ctrl) {
					var iconName = $attrs.icon || 'success';
					$element.addClass('weui-icon-' + iconName);
				}
  			};
		})
	
})(); 
(function() {

	// ng-weui-loading	
	angular
		.module('ng-weui-loading', [])
		.directive('weuiLoading', ['$document', function($document) {
			 return {
			    restrict: 'E',
			    scope: true,
			    replace: true,
			    template: 	'<div class="ng-weui-loading-wrapper hidden">'+
						        '<div class="weui-toast">'+
						            '<i class="weui-loading weui-icon_toast"></i>'+
						            '<p class="weui-toast__content"></p>'+
						        '</div>'+
						    '</div>',
			    link: function($scope, $element) {
			    }
			}
		}])
		.provider('$weuiLoading', function () {
	        var defaults = this.defaults = {
				template: '数据加载中',
				templateUrl: null,
				noBackdrop: true,
				hideOnStateChange: false
	        }

	        this.$get = ['$document', '$weuiTemplateLoader', '$compile', '$q', '$http', '$rootScope', '$timeout', '$window', '$controller', '$weuiBackdrop',
            function ($document, $weuiTemplateLoader, $compile, $q, $http, $rootScope, $timeout, $window, $controller, $weuiBackdrop) {
	        	var self   = this,
					$el    = angular.element,
					$body  = $el(document.body),
					extend = angular.extend,
					noop   = angular.noop,
					copy   = angular.copy;

	        	var privateMethods = {
	        		instance: null,
					getLoader: function() {
						if (!privateMethods.instance) {
							privateMethods.instance = $weuiTemplateLoader.compile({
								template: '<weui-loading></weui-loading>',
								appendTo: $body
							})
							.then(function(self) {
								self.show = function(options) {
									var templatePromise = options.templateUrl ? $weuiTemplateLoader.load(options.templateUrl) :	$q.when(options.template || options.content || '');

									self.scope = options.scope || self.scope;

									if (!self.isShown) {
										self.hasBackdrop = !options.noBackdrop;
										if (self.hasBackdrop) {
											$weuiBackdrop.retain();
											$weuiBackdrop.getElement().addClass('backdrop-loading');
										}
									}

									templatePromise.then(function(html) {
										if (html) {
											var loading = $el(self.element[0].querySelector('.weui-toast__content'));
											loading.html(html);
											$compile(loading.contents())(self.scope);
										}

										if (self.isShown) {
											self.element.addClass('visible');
											self.element[0].offsetWidth;
											self.element.addClass('active');
											$body.addClass('ng-weui-loading-active');
										}
									});

									self.isShown = true;
								};

								self.hide = function() {
									if (self.isShown) {
										if (self.hasBackdrop) {
											$weuiBackdrop.release();
											$weuiBackdrop.getElement().removeClass('backdrop-loading');
										}
										self.element.removeClass('active');
										$body.removeClass('ng-weui-loading-active');
										self.element.removeClass('visible');
									}

									self.isShown = false;
									var loading = $el(self.element[0].querySelector('.weui-toast__content'));
									loading.html('');
								};

								return self;
							});
						}
						return privateMethods.instance;
					}
	        	}

	        	var publicMethods = {
	        		show: function(opts) {
	        			var options = extend(copy(defaults), opts);

						if (options.hideOnStateChange) {
							$rootScope.$on('$stateChangeSuccess', publicMethods.hide);
							$rootScope.$on('$stateChangeError', publicMethods.hide);
						}

						return privateMethods.getLoader()
						.then(function(loader) {
							return loader.show(options);
						});
	        		},
	        		hide: function() {
						return privateMethods.getLoader()
						.then(function(loader) {
							return loader.hide();
						});
	        		}
	        	}
	        	
	        	return publicMethods;
	        }]

	        this.setDefaults = function (newDefaults) {
	            angular.extend(defaults, newDefaults);
	        }
	    })
	
})(); 
(function() {

	// ng-weui-msg	
	angular
		.module('ng-weui-msg', [])
		.directive('weuiMsg', function(){
			return {
				scope: {
					type: '@',
					title: '@',
					desc: '@',
					onSuccess: '&',
					onWarn: '&',
				},
				restrict: 'E',
				template:   '<div class="weui-msg">'+
						        '<div class="weui-msg__icon-area"><i class="weui-icon_msg" ng-class="cls"></i></div>'+
						        '<div class="weui-msg__text-area">'+
						            '<h2 class="weui-msg__title" ng-bind="title"></h2>'+
						            '<p class="weui-msg__desc" ng-bind="desc"></p>'+
						        '</div>'+
						        '<div class="weui-msg__opr-area">'+
						            '<p class="weui-btn-area">'+
						                '<a href="javascript:void(0);" class="weui-btn weui-btn_primary" ng-click="onSuccess()">确定</a>'+
						                '<a href="javascript:void(0);" class="weui-btn weui-btn_default" ng-click="onWarn()">取消</a>'+
						            '</p>'+
						        '</div>'+
						        '<div class="weui-msg__extra-area" ng-transclude></div>'+
						    '</div>',
				replace: true,
				transclude: true,
				link: function($scope, iElm, iAttrs, controller) {
					$scope.cls = iAttrs.type === 'warn' ? {'weui-icon-warn' : !0} : {'weui-icon-success' : !0}
				}
			};
		})
	
})(); 
(function() {

	// ng-weui-panel	
	angular
		.module('ng-weui-panel', [])
		.directive('weuiPanel', function(){
			return {
				scope: {
					title: '@',
					viewText: '@',
					viewMore: '&'
				},
				restrict: 'AE',
				template:   '<div class="weui-panel weui-panel_access">'+
								'<div class="weui-panel__hd" ng-if="title" ng-bind="title"></div>'+
								'<div class="weui-panel__bd" ng-transclude></div>'+
								'<div class="weui-panel__ft" ng-if="show">'+
					                '<a href="javascript:void(0);" class="weui-cell weui-cell_access weui-cell_link" ng-click="viewMore()">'+
					                    '<div class="weui-cell__bd" ng-bind="viewText"></div>'+
					                    '<span class="weui-cell__ft"></span>'+
					                '</a>'+    
					            '</div>'+
							'</div>',
				replace: true,
				transclude: true,
				link: function($scope, iElm, iAttrs, controller) {
					$scope.viewText = $scope.viewText || '查看更多';
					$scope.show = !!iAttrs.viewMore && angular.isFunction($scope.viewMore);
				}
			};
		})
		.directive('panelAppmsg', function(){
			return {
				scope: {
					image: '=',
					title: '=',
					desc: '='
				},
				require: '^?weuiPanel',
				restrict: 'E',
				template:   '<a href="javascript:void(0);" class="weui-media-box weui-media-box_appmsg">'+
				                '<div class="weui-media-box__hd" ng-if="image">'+
				                    '<img class="weui-media-box__thumb" ng-src="{{image}}" alt="">'+
				                '</div>'+
				                '<div class="weui-media-box__bd">'+
				                    '<h4 class="weui-media-box__title" ng-if="title" ng-bind="title"></h4>'+
				                    '<p class="weui-media-box__desc" ng-if="desc" ng-bind="desc"></p>'+
				                '</div>'+
				            '</a>',
				replace: true
			};
		})
		.directive('panelText', function(){
			return {
				scope: {
					title: '=',
					desc: '='
				},
				require: '^?weuiPanel',
				restrict: 'E',
				template:   '<div class="weui-media-box weui-media-box_text">'+
				                '<h4 class="weui-media-box__title" ng-if="title" ng-bind="title"></h4>'+
				                '<p class="weui-media-box__desc" ng-if="desc" ng-bind="desc"></p>'+
				                '<div ng-transclude></div>'+
				            '</div>',
				replace: true,
				transclude: true
			};
		})
		.directive('weuiPanelSm', function(){
			return {
				scope: {
					title: '@'
				},
				restrict: 'AE',
				template:   '<div class="weui-panel">'+
								'<div class="weui-panel__hd" ng-if="title" ng-bind="title"></div>'+
								'<div class="weui-panel__bd">'+
									'<div class="weui-media-box weui-media-box_small-appmsg">'+
						                '<div class="weui-cells" ng-transclude>'+
						                '</div>'+
						            '</div>'+
								'</div>'+
							'</div>',
				replace: true,
				transclude: true
			};
		})
		.directive('panelAppmsgSm', function(){
			return {
				scope: {
					image: '=',
					title: '='
				},
				require: '^?weuiPanelSm',
				restrict: 'E',
				template:   '<a class="weui-cell weui-cell_access" href="javascript:;">'+
		                        '<div class="weui-cell__hd" ng-if="image">'+
		                        	'<img ng-src="{{image}}" alt="" style="width:20px;margin-right:5px;display:block">'+
		                        '</div>'+
		                        '<div class="weui-cell__bd weui-cell_primary">'+
		                            '<p ng-bind="title"></p>'+
		                        '</div>'+
		                        '<span class="weui-cell__ft"></span>'+
		                    '</a>',
				replace: true
			};
		})
	
})(); 
(function() {

	// ng-weui-popup	
	angular
		.module('ng-weui-popup', [])
		.directive('weuiPopup', ['$document', function($document) {
			 return {
			    restrict: 'E',
			    scope: true,
			    replace: true,
			    template: 	'<div class="ng-weui-dialog-wrapper hidden" ng-class="className">'+
						        '<div class="weui-dialog">'+
						            '<div class="weui-dialog__hd"><strong class="weui-dialog__title" ng-bind="title"></strong></div>'+
						            '<div class="weui-dialog__bd"></div>'+
						            '<div class="weui-dialog__ft" ng-show="buttons.length">'+
						                '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_default" ng-repeat="button in buttons" ng-click="$buttonTapped(button, $event)" ng-class="button.type || \'button-default\'" ng-bind="button.text"></a>'+
						            '</div>'+
						       '</div>'+
						    '</div>',
			    link: function($scope, $element) {
					var keyUp = function(e) {
						if (e.which == 27) {
							var $popup = $element.data('$ngWeuiPopup')
							$popup.responseDeferred.promise.close();
							$scope.$apply();
						}
					};

					$scope.$on('$destroy', function() {
						$element.remove();
						$document.unbind('keyup', keyUp);
					});

					$document.bind('keyup', keyUp);
			    }
			}
		}])
		.provider('$weuiPopup', function () {
			var defaults = this.defaults = {
	        	cancelText: '取消',
	        	cancelType: 'weui-dialog__btn_default',
	        	okText: '确定',
	        	okType: 'weui-dialog__btn_primary'
	        }

	        this.$get = ['$q', '$timeout', '$rootScope', '$compile', '$weuiTemplateLoader', '$weuiBackdrop', 
            function ($q, $timeout, $rootScope, $compile, $weuiTemplateLoader, $weuiBackdrop) {
	        	var self   = this,
					$el    = angular.element,
					$body  = $el(document.body),
					extend = angular.extend,
					noop   = angular.noop,
					copy   = angular.copy;

				var config = {
					stackPushDelay: 75
				}

				var popupStack = [];

				var privateMethods = {
					focusInput: function(element) {
						var focusOn = element[0].querySelector('[autofocus]');
						if (focusOn) {
							focusOn.focus();
						}
					}
				}

	        	var publicMethods = {
					show        : showPopup,
					alert       : showAlert,
					confirm     : showConfirm,
					prompt      : showPrompt,
					_createPopup: createPopup,
					_popupStack : popupStack
	        	}

	        	return publicMethods;

				function createPopup(options) {
					options = extend({
						scope  : null,
						title  : '',
						buttons: []
					}, options || {});

					var self = {};
					self.scope = (options.scope || $rootScope).$new();
					self.element = $el('<weui-popup></weui-popup>');
					self.responseDeferred = $q.defer();

					$compile(self.element)(self.scope);

					self.element.data('$ngWeuiPopup', self)

					extend(self.scope, {
						title: options.title,
						buttons: options.buttons,
						className: options.className,
						$buttonTapped: function(button, event) {
							var result = (button.onTap || noop).apply(self, [event]);
							event = event.originalEvent || event; 

							if (!event.defaultPrevented) {
								self.responseDeferred.resolve(result);
							}
						}
					});

					var POPUP_TPL = options.templateUrl ? $weuiTemplateLoader.load(options.templateUrl) : (options.template || options.content || '')

					$q.when(POPUP_TPL).then(function(template) {
						var popupBody = $el(self.element[0].querySelector('.weui-dialog__bd'));
						if (template) {
							popupBody.html(template);
							$compile(popupBody.contents())(self.scope);
						} else {
							popupBody.remove();
						}
					});

					self.show = function() {
						if (self.isShown || self.removed) return;

						self.isShown = true;
						if (!self.isShown) return;
						$body.append(self.element);
						self.element[0].offsetWidth;
						self.element.addClass('visible active');
						privateMethods.focusInput(self.element);
					};

					self.hide = function(callback) {
						callback = callback || noop;
						if (!self.isShown) return callback();

						self.isShown = false;
						self.element.removeClass('active');
						$timeout(callback, 250, false);
					};

					self.remove = function() {
						if (self.removed) return;

						self.hide(function() {
							self.element.remove();
							self.scope.$destroy();
						});

						self.removed = true;
					};

					return self;
				}

				function showPopup(options) {
					var popup = publicMethods._createPopup(options);

					var showDelay = 0;

					if (popupStack.length > 0) {
						showDelay = config.stackPushDelay;
						$timeout(popupStack[popupStack.length - 1].hide, showDelay, false);
					} else {
						$body.addClass('ng-weui-popup-open');
						$weuiBackdrop.retain();
				    	var $backdrop = $weuiBackdrop.getElement();
				    	$backdrop.addClass('backdrop-popup');
				    	$backdrop.off().on('click', function(e) {
				    		if ($backdrop.hasClass('backdrop-popup')) {
				    			popup.responseDeferred.promise.close();
				    		}
				    	})
					}

					popup.responseDeferred.promise.close = function popupClose(result) {
						if (!popup.removed) popup.responseDeferred.resolve(result);
					};
					popup.responseDeferred.notify({ close: popup.responseDeferred.close });

					doShow();

					return popup.responseDeferred.promise;

					function doShow() {
						popupStack.push(popup);
						$timeout(popup.show, showDelay, false);

						popup.responseDeferred.promise.then(function(result) {
							var index = popupStack.indexOf(popup);
							if (index !== -1) {
								popupStack.splice(index, 1);
							}

							popup.remove();

							if (popupStack.length > 0) {
								popupStack[popupStack.length - 1].show();
							} else {
								$weuiBackdrop.release();
								$weuiBackdrop.getElement().removeClass('backdrop-popup');

								$timeout(function() {
									if (!popupStack.length) {
										$body.removeClass('ng-weui-popup-open');
									}
								}, 400, false);
							}

							return result;
						});
					}
				}

				function showAlert(options) {
					return showPopup(extend({
						buttons: [
							{
								text: options.okText || defaults.okText,
								type: options.okType || defaults.okType,
								onTap: function() {
									return true;
								}
							}
						]
					}, options || {}));
				}	

				function showConfirm(options) {
					return showPopup(extend({
						buttons: [
							{
								text: options.cancelText || defaults.cancelText,
								type: options.cancelType || defaults.cancelType,
								onTap: function() { 
									return false; 
								}
							}, 
							{
								text: options.okText || defaults.okText,
								type: options.okType || defaults.okType,
								onTap: function() { 
									return true; 
								}
							}
						]
					}, options || {}));
				}

				function showPrompt(options) {
					var scope = $rootScope.$new(true);
					scope.data = {};
					scope.data.fieldtype = options.inputType ? options.inputType : 'text';
					scope.data.response = options.defaultText ? options.defaultText : '';
					scope.data.placeholder = options.inputPlaceholder ? options.inputPlaceholder : '';
					scope.data.maxlength = options.maxLength ? parseInt(options.maxLength) : '';
					var text = '';
					if (options.template && /<[a-z][\s\S]*>/i.test(options.template) === false) {
						text = '<span>' + options.template + '</span>';
						delete options.template;
					}
					return showPopup(extend({
						template: 	text + '<input class="weui-input" ng-model="data.response" '
										+ 'type="{{ data.fieldtype }}"'
										+ 'maxlength="{{ data.maxlength }}"'
										+ 'placeholder="{{ data.placeholder }}"'
										+ '>',
						scope: scope,
						buttons: [
							{
								text: options.cancelText || defaults.cancelText,
								type: options.cancelType || defaults.cancelType,
								onTap: function() {}
							}, 
							{
								text: options.okText || defaults.okText,
								type: options.okType || defaults.okType,
								onTap: function() {
									return scope.data.response || '';
								}
							}
						]
					}, options || {}));
				}
	        }]

	        this.setDefaults = function (newDefaults) {
	            angular.extend(defaults, newDefaults);
	        }
	    })
	
})(); 
(function() {

	// ng-weui-radio	
	angular
		.module('ng-weui-radio', [])
		.directive('weuiRadioGroup', function(){
			return {
				scope: {
					viewText: '@',
					viewMore: '&'
				},
				restrict: 'E',
				template:   '<div class="weui-cells weui-cells_radio">'+
								'<div class="weui-radio__bd" ng-transclude></div>'+
								'<div class="weui-radio__ft" ng-if="show">'+
									'<a href="javascript:void(0);" class="weui-cell weui-cell_link" ng-click="viewMore()">'+
						                '<div class="weui-cell__bd" ng-bind="viewText"></div>'+
						            '</a>'+
								'</div>'+
							'</div>',
				replace: true,
				transclude: true,
				link: function($scope, iElm, iAttrs, controller) {
					$scope.viewText = $scope.viewText || '添加更多';
					$scope.show = !!iAttrs.viewMore && angular.isFunction($scope.viewMore);
				}
			};
		})
		.directive('weuiRadio', function(){
			return {
				restrict: 'E',
				replace: true,
				require: '?ngModel',
				transclude: true,
				template: 	'<label class="weui-cell weui-check__label">'+
								'<div class="weui-cell__bd">'+
									'<p ng-transclude></p>'+
								'</div>'+
								'<div class="weui-cell__ft">'+
									'<input type="radio" class="weui-check" name="radio">'+
									'<span class="weui-icon-checked"></span>'+
								'</div>'+
							'</label>',

				compile: function(element, attr) {
					var input = element.find('input');
					
					angular.forEach({
						'name': attr.name,
						'value': attr.value,
						'disabled': attr.disabled,
						'ng-value': attr.ngValue,
						'ng-model': attr.ngModel,
						'ng-disabled': attr.ngDisabled,
						'ng-change': attr.ngChange,
						'ng-required': attr.ngRequired,
						'required': attr.required
					}, function(value, name) {
						if (angular.isDefined(value)) {
							input.attr(name, value);
						}
					});

					return function($scope, iElm, iAttrs, controller) {
						$scope.getValue = function() {
							return $scope.ngValue || iAttrs.value;
						};
					};
				}
			};
		})
	
})(); 
(function() {
	var DelegateService = function(methodNames) {
		if (methodNames.indexOf('$getByHandle') > -1) {
			throw new Error("Method '$getByHandle' is implicitly added to each delegate service. Do not list it as a method.");
		}

		function trueFn() {
			return true;
		}

		return ['$log', function($log) {
			function DelegateInstance(instances, handle) {
				this._instances = instances;
				this.handle = handle;
			}
			methodNames.forEach(function(methodName) {
				DelegateInstance.prototype[methodName] = instanceMethodCaller(methodName);
			});

			function DelegateService() {
				this._instances = [];
			}
			DelegateService.prototype = DelegateInstance.prototype;
			DelegateService.prototype._registerInstance = function(instance, handle, filterFn) {
				var instances = this._instances;
				instance.$$delegateHandle = handle;
				instance.$$filterFn = filterFn || trueFn;
				instances.push(instance);

				return function deregister() {
					var index = instances.indexOf(instance);
					if (index !== -1) {
						instances.splice(index, 1);
					}
				};
			};
			DelegateService.prototype.$getByHandle = function(handle) {
				return new DelegateInstance(this._instances, handle);
			};

			return new DelegateService();

			function instanceMethodCaller(methodName) {
				return function caller() {
					var handle = this.handle;
					var args = arguments;
					var foundInstancesCount = 0;
					var returnValue;

					this._instances.forEach(function(instance) {
						if ((!handle || handle == instance.$$delegateHandle) && instance.$$filterFn(instance)) {
							foundInstancesCount++;
							var ret = instance[methodName].apply(instance, args);
							//Only return the value from the first call
							if (foundInstancesCount === 1) {
								returnValue = ret;
							}
						}
					});

					if (!foundInstancesCount && handle) {
						return $log.warn('Delegate for handle "' + handle + '" could not find a ' + 'corresponding element with delegate-handle="' + handle + '"! ' + methodName + '() was not called!\n' + 'Possible cause: If you are calling ' + methodName + '() immediately, and ' + 'your element with delegate-handle="' + handle + '" is a child of your ' + 'controller, then your element may not be compiled yet. Put a $timeout ' + 'around your call to ' + methodName + '() and try again.');
					}
					return returnValue;
				};
			}

		}];
	}

	var initialize = function(options) {
		var slider = this;

		var touchStartEvent, touchMoveEvent, touchEndEvent;
		if (window.navigator.pointerEnabled) {
			touchStartEvent = 'pointerdown';
			touchMoveEvent = 'pointermove';
			touchEndEvent = 'pointerup';
		} else if (window.navigator.msPointerEnabled) {
			touchStartEvent = 'MSPointerDown';
			touchMoveEvent = 'MSPointerMove';
			touchEndEvent = 'MSPointerUp';
		} else {
			touchStartEvent = 'touchstart';
			touchMoveEvent = 'touchmove';
			touchEndEvent = 'touchend';
		}

		var mouseStartEvent = 'mousedown';
		var mouseMoveEvent = 'mousemove';
		var mouseEndEvent = 'mouseup';

		// utilities
		var noop = function() {}; // simple no operation function
		var offloadFn = function(fn) {
				setTimeout(fn || noop, 0);
			}; // offload a functions execution

		// check browser capabilities
		var browser = {
			addEventListener: !! window.addEventListener,
			transitions: (function(temp) {
				var props = ['transitionProperty', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'];
				for (var i in props) if (temp.style[props[i]] !== undefined) return true;
				return false;
			})(document.createElement('swipe'))
		};


		var container = options.el;

		// quit if no root element
		if (!container) return;
		var element = container.children[0];
		var slides, slidePos, width, length;
		options = options || {};
		var index = parseInt(options.startSlide, 10) || 0;
		var speed = options.speed || 300;
		options.continuous = options.continuous !== undefined ? options.continuous : true;

		function setup() {

			// do not setup if the container has no width
			if (!container.offsetWidth) {
				return;
			}

			// cache slides
			slides = element.children;
			length = slides.length;

			// set continuous to false if only one slide
			if (slides.length < 2) options.continuous = false;

			//special case if two slides
			if (browser.transitions && options.continuous && slides.length < 3) {
				element.appendChild(slides[0].cloneNode(true));
				element.appendChild(element.children[1].cloneNode(true));
				slides = element.children;
			}

			// create an array to store current positions of each slide
			slidePos = new Array(slides.length);

			// determine width of each slide
			width = container.offsetWidth || container.getBoundingClientRect().width;

			element.style.width = (slides.length * width) + 'px';

			// stack elements
			var pos = slides.length;
			while (pos--) {

				var slide = slides[pos];

				slide.style.width = width + 'px';
				slide.setAttribute('data-index', pos);

				if (browser.transitions) {
					slide.style.left = (pos * -width) + 'px';
					move(pos, index > pos ? -width : (index < pos ? width : 0), 0);
				}

			}

			// reposition elements before and after index
			if (options.continuous && browser.transitions) {
				move(circle(index - 1), -width, 0);
				move(circle(index + 1), width, 0);
			}

			if (!browser.transitions) element.style.left = (index * -width) + 'px';

			container.style.visibility = 'visible';

			options.slidesChanged && options.slidesChanged();
		}

		function prev(slideSpeed) {

			if (options.continuous) slide(index - 1, slideSpeed);
			else if (index) slide(index - 1, slideSpeed);

		}

		function next(slideSpeed) {

			if (options.continuous) slide(index + 1, slideSpeed);
			else if (index < slides.length - 1) slide(index + 1, slideSpeed);

		}

		function circle(index) {

			// a simple positive modulo using slides.length
			return (slides.length + (index % slides.length)) % slides.length;

		}

		function slide(to, slideSpeed) {

			// do nothing if already on requested slide
			if (index == to) return;

			if (!slides) {
				index = to;
				return;
			}

			if (browser.transitions) {

				var direction = Math.abs(index - to) / (index - to); // 1: backward, -1: forward

				// get the actual position of the slide
				if (options.continuous) {
					var naturalDirection = direction;
					direction = -slidePos[circle(to)] / width;

					// if going forward but to < index, use to = slides.length + to
					// if going backward but to > index, use to = -slides.length + to
					if (direction !== naturalDirection) to = -direction * slides.length + to;

				}

				var diff = Math.abs(index - to) - 1;

				// move all the slides between index and to in the right direction
				while (diff--) move(circle((to > index ? to : index) - diff - 1), width * direction, 0);

				to = circle(to);

				move(index, width * direction, slideSpeed || speed);
				move(to, 0, slideSpeed || speed);

				if (options.continuous) move(circle(to - direction), -(width * direction), 0); // we need to get the next in place

			} else {

				to = circle(to);
				animate(index * -width, to * -width, slideSpeed || speed);
				//no fallback for a circular continuous if the browser does not accept transitions
			}

			index = to;
			offloadFn(options.callback && options.callback(index, slides[index]));
		}

		function move(index, dist, speed) {

			translate(index, dist, speed);
			slidePos[index] = dist;

		}

		function translate(index, dist, speed) {

			var slide = slides[index];
			var style = slide && slide.style;

			if (!style) return;

			style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = speed + 'ms';

			style.webkitTransform = 'translate(' + dist + 'px,0)' + 'translateZ(0)';
			style.msTransform = style.MozTransform = style.OTransform = 'translateX(' + dist + 'px)';

		}

		function animate(from, to, speed) {

			// if not an animation, just reposition
			if (!speed) {

				element.style.left = to + 'px';
				return;

			}

			var start = +new Date();

			var timer = setInterval(function() {

				var timeElap = +new Date() - start;

				if (timeElap > speed) {

					element.style.left = to + 'px';

					if (delay) begin();

					options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

					clearInterval(timer);
					return;

				}

				element.style.left = (((to - from) * (Math.floor((timeElap / speed) * 100) / 100)) + from) + 'px';

			}, 4);

		}

		// setup auto slideshow
		var delay = options.auto || 0;
		var interval;

		function begin() {

			interval = setTimeout(next, delay);

		}

		function stop() {

			delay = options.auto || 0;
			clearTimeout(interval);

		}


		// setup initial vars
		var start = {};
		var delta = {};
		var isScrolling;

		// setup event capturing
		var events = {

			handleEvent: function(event) {
				if (!event.touches && event.pageX && event.pageY) {
					event.touches = [{
						pageX: event.pageX,
						pageY: event.pageY
					}];
				}

				switch (event.type) {
				case touchStartEvent:
					this.start(event);
					break;
				case mouseStartEvent:
					this.start(event);
					break;
				case touchMoveEvent:
					this.touchmove(event);
					break;
				case mouseMoveEvent:
					this.touchmove(event);
					break;
				case touchEndEvent:
					offloadFn(this.end(event));
					break;
				case mouseEndEvent:
					offloadFn(this.end(event));
					break;
				case 'webkitTransitionEnd':
				case 'msTransitionEnd':
				case 'oTransitionEnd':
				case 'otransitionend':
				case 'transitionend':
					offloadFn(this.transitionEnd(event));
					break;
				case 'resize':
					offloadFn(setup);
					break;
				}

				if (options.stopPropagation) event.stopPropagation();

			},
			start: function(event) {

				// prevent to start if there is no valid event
				if (!event.touches) {
					return;
				}

				var touches = event.touches[0];

				// measure start values
				start = {

					// get initial touch coords
					x: touches.pageX,
					y: touches.pageY,

					// store time to determine touch duration
					time: +new Date()

				};

				// used for testing first move event
				isScrolling = undefined;

				// reset delta and end measurements
				delta = {};

				// attach touchmove and touchend listeners
				element.addEventListener(touchMoveEvent, this, false);
				element.addEventListener(mouseMoveEvent, this, false);

				element.addEventListener(touchEndEvent, this, false);
				element.addEventListener(mouseEndEvent, this, false);

				document.addEventListener(touchEndEvent, this, false);
				document.addEventListener(mouseEndEvent, this, false);
			},
			touchmove: function(event) {

				// ensure there is a valid event
				// ensure swiping with one touch and not pinching
				// ensure sliding is enabled
				if (!event.touches || event.touches.length > 1 || event.scale && event.scale !== 1 || slider.slideIsDisabled) {
					return;
				}

				if (options.disableScroll) event.preventDefault();

				var touches = event.touches[0];

				// measure change in x and y
				delta = {
					x: touches.pageX - start.x,
					y: touches.pageY - start.y
				};

				// determine if scrolling test has run - one time test
				if (typeof isScrolling == 'undefined') {
					isScrolling = !! (isScrolling || Math.abs(delta.x) < Math.abs(delta.y));
				}

				// if user is not trying to scroll vertically
				if (!isScrolling) {

					// prevent native scrolling
					event.preventDefault();

					// stop slideshow
					stop();

					// increase resistance if first or last slide
					if (options.continuous) { // we don't add resistance at the end

						translate(circle(index - 1), delta.x + slidePos[circle(index - 1)], 0);
						translate(index, delta.x + slidePos[index], 0);
						translate(circle(index + 1), delta.x + slidePos[circle(index + 1)], 0);

					} else {
						// If the slider bounces, do the bounce!
						if (options.bouncing) {
							delta.x = delta.x / ((!index && delta.x > 0 || // if first slide and sliding left
							index == slides.length - 1 && // or if last slide and sliding right
							delta.x < 0 // and if sliding at all
							) ? (Math.abs(delta.x) / width + 1) // determine resistance level
							: 1); // no resistance if false
						} else {
							if (width * index - delta.x < 0) { //We are trying scroll past left boundary
								delta.x = Math.min(delta.x, width * index); //Set delta.x so we don't go past left screen
							}
							if (Math.abs(delta.x) > width * (slides.length - index - 1)) { //We are trying to scroll past right bondary
								delta.x = Math.max(-width * (slides.length - index - 1), delta.x); //Set delta.x so we don't go past right screen
							}
						}

						// translate 1:1
						translate(index - 1, delta.x + slidePos[index - 1], 0);
						translate(index, delta.x + slidePos[index], 0);
						translate(index + 1, delta.x + slidePos[index + 1], 0);
					}

					options.onDrag && options.onDrag();
				}

			},
			end: function() {

				// measure duration
				var duration = +new Date() - start.time;

				// determine if slide attempt triggers next/prev slide
				var isValidSlide = Number(duration) < 250 && // if slide duration is less than 250ms
				Math.abs(delta.x) > 20 || // and if slide amt is greater than 20px
				Math.abs(delta.x) > width / 2; // or if slide amt is greater than half the width

				// determine if slide attempt is past start and end
				var isPastBounds = (!index && delta.x > 0) || // if first slide and slide amt is greater than 0
				(index == slides.length - 1 && delta.x < 0); // or if last slide and slide amt is less than 0

				if (options.continuous) isPastBounds = false;

				// determine direction of swipe (true:right, false:left)
				var direction = delta.x < 0;

				// if not scrolling vertically
				if (!isScrolling) {

					if (isValidSlide && !isPastBounds) {

						if (direction) {

							if (options.continuous) { // we need to get the next in this direction in place

								move(circle(index - 1), -width, 0);
								move(circle(index + 2), width, 0);

							} else {
								move(index - 1, -width, 0);
							}

							move(index, slidePos[index] - width, speed);
							move(circle(index + 1), slidePos[circle(index + 1)] - width, speed);
							index = circle(index + 1);

						} else {
							if (options.continuous) { // we need to get the next in this direction in place

								move(circle(index + 1), width, 0);
								move(circle(index - 2), -width, 0);

							} else {
								move(index + 1, width, 0);
							}

							move(index, slidePos[index] + width, speed);
							move(circle(index - 1), slidePos[circle(index - 1)] + width, speed);
							index = circle(index - 1);

						}

						options.callback && options.callback(index, slides[index]);

					} else {

						if (options.continuous) {

							move(circle(index - 1), -width, speed);
							move(index, 0, speed);
							move(circle(index + 1), width, speed);

						} else {

							move(index - 1, -width, speed);
							move(index, 0, speed);
							move(index + 1, width, speed);
						}

					}

				}

				// kill touchmove and touchend event listeners until touchstart called again
				element.removeEventListener(touchMoveEvent, events, false);
				element.removeEventListener(mouseMoveEvent, events, false);

				element.removeEventListener(touchEndEvent, events, false);
				element.removeEventListener(mouseEndEvent, events, false);

				document.removeEventListener(touchEndEvent, events, false);
				document.removeEventListener(mouseEndEvent, events, false);

				options.onDragEnd && options.onDragEnd();
			},
			transitionEnd: function(event) {

				if (parseInt(event.target.getAttribute('data-index'), 10) == index) {

					if (delay) begin();

					options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

				}

			}

		};

		// Public API
		this.update = function() {
			setTimeout(setup);
		};
		this.setup = function() {
			setup();
		};

		this.loop = function(value) {
			if (arguments.length) options.continuous = !! value;
			return options.continuous;
		};

		this.enableSlide = function(shouldEnable) {
			if (arguments.length) {
				this.slideIsDisabled = !shouldEnable;
			}
			return !this.slideIsDisabled;
		};

		this.slide = this.select = function(to, speed) {
			// cancel slideshow
			stop();

			slide(to, speed);
		};

		this.prev = this.previous = function() {
			// cancel slideshow
			stop();

			prev();
		};

		this.next = function() {
			// cancel slideshow
			stop();

			next();
		};

		this.stop = function() {
			// cancel slideshow
			stop();
		};

		this.start = function() {
			begin();
		};

		this.autoPlay = function(newDelay) {
			if (!delay || delay < 0) {
				stop();
			} else {
				delay = newDelay;
				begin();
			}
		};

		this.currentIndex = this.selected = function() {
			// return current index position
			return index;
		};

		this.slidesCount = this.count = function() {
			// return total number of slides
			return length;
		};

		this.kill = function() {
			// cancel slideshow
			stop();

			// reset element
			element.style.width = '';
			element.style.left = '';

			// reset slides so no refs are held on to
			slides && (slides = []);

			// removed event listeners
			if (browser.addEventListener) {

				// remove current event listeners
				element.removeEventListener(touchStartEvent, events, false);
				element.removeEventListener(mouseStartEvent, events, false);
				element.removeEventListener('webkitTransitionEnd', events, false);
				element.removeEventListener('msTransitionEnd', events, false);
				element.removeEventListener('oTransitionEnd', events, false);
				element.removeEventListener('otransitionend', events, false);
				element.removeEventListener('transitionend', events, false);
				window.removeEventListener('resize', events, false);

			} else {

				window.onresize = null;

			}
		};

		this.load = function() {
			// trigger setup
			setup();

			// start auto slideshow if applicable
			if (delay) begin();


			// add event listeners
			if (browser.addEventListener) {

				// set touchstart event on element
				element.addEventListener(touchStartEvent, events, false);
				element.addEventListener(mouseStartEvent, events, false);

				if (browser.transitions) {
					element.addEventListener('webkitTransitionEnd', events, false);
					element.addEventListener('msTransitionEnd', events, false);
					element.addEventListener('oTransitionEnd', events, false);
					element.addEventListener('otransitionend', events, false);
					element.addEventListener('transitionend', events, false);
				}

				// set resize event on window
				window.addEventListener('resize', events, false);

			} else {

				window.onresize = function() {
					setup();
				}; // to play nice with old IE

			}
		};
	}

	// ng-weui-slideBox	
	angular
		.module('ng-weui-slideBox', [])
		.directive('weuiSlideBox', ['$animate', '$timeout', '$compile', '$weuiSlideBoxDelegate', '$weuiScrollDelegate',
		function($animate, $timeout, $compile, $weuiSlideBoxDelegate, $weuiScrollDelegate) {
			return {
				restrict: 'E',
				replace: true,
				transclude: true,
				scope: {
					autoPlay: '=',
					doesContinue: '@',
					slideInterval: '@',
					showPager: '@',
					pagerClick: '&',
					disableScroll: '@',
					onSlideChanged: '&',
					activeSlide: '=?',
					bounce: '@'
				},
				controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
					var _this = this;
					
					var continuous = $scope.$eval($scope.doesContinue) === true;
					var bouncing = ($scope.$eval($scope.bounce) !== false); //Default to true
					var shouldAutoPlay = angular.isDefined($attrs.autoPlay) ? !!$scope.autoPlay : false;
					var slideInterval = shouldAutoPlay ? $scope.$eval($scope.slideInterval) || 4000 : 0;

					var slider = new initialize({
						el: $element[0],
						auto: slideInterval,
						continuous: continuous,
						startSlide: $scope.activeSlide,
						bouncing: bouncing,
						slidesChanged: function() {
							$scope.currentSlide = slider.currentIndex();

							// Try to trigger a digest
							$timeout(function() {});
						},
						callback: function(slideIndex) {
							$scope.currentSlide = slideIndex;
							$scope.onSlideChanged({ 
								index: $scope.currentSlide, 
								$index: $scope.currentSlide
							});
							$scope.$parent.$broadcast('slideBox.slideChanged', slideIndex);
							$scope.activeSlide = slideIndex;
							// Try to trigger a digest
							$timeout(function() {});
						},
						onDrag: function() {
							freezeAllScrolls(true);
						},
						onDragEnd: function() {
							freezeAllScrolls(false);
						}
					});

					function freezeAllScrolls(shouldFreeze) {
						if (shouldFreeze && !_this.isScrollFreeze) {
							$weuiScrollDelegate.freezeAllScrolls(shouldFreeze);
						} else if (!shouldFreeze && _this.isScrollFreeze) {
							$weuiScrollDelegate.freezeAllScrolls(false);
						}
						_this.isScrollFreeze = shouldFreeze;
					}

					slider.enableSlide($scope.$eval($attrs.disableScroll) !== true);

					$scope.$watch('activeSlide', function(nv) {
						if (angular.isDefined(nv)) {
							slider.slide(nv);
						}
					});

					$scope.$on('slideBox.nextSlide', function() {
						slider.next();
					});

					$scope.$on('slideBox.prevSlide', function() {
						slider.prev();
					});

					$scope.$on('slideBox.setSlide', function(e, index) {
						slider.slide(index);
					});

					var deregisterInstance = $weuiSlideBoxDelegate._registerInstance(
						slider, $attrs.delegateHandle, function() {
							return true
						}
					);

					$scope.$on('$destroy', function() {
						deregisterInstance();
						slider.kill();
					});

					this.slidesCount = function() {
						return slider.slidesCount();
					};

					this.onPagerClick = function(index) {
						$scope.pagerClick({index: index});
					};

					$timeout(function() {
						slider.load();
					});
    			}],
				template: 	'<div class="weui-slider">' +
								'<div class="weui-slider-slides" ng-transclude>' +
								'</div>' +
							'</div>',
				link: function($scope, $element, $attr) {
					$animate.enabled($element, false);

					if (!angular.isDefined($attr.showPager)) {
						$scope.showPager = true;
						getPager().toggleClass('hide', !true);
					}

					$attr.$observe('showPager', function(show) {
						if (show === undefined) return;
						show = $scope.$eval(show);
						getPager().toggleClass('hide', !show);
					});

					var pager;

					function getPager() {
						if (!pager) {
							var childScope = $scope.$new();
							pager = angular.element('<weui-pager></weui-pager>');
							$element.append(pager);
							pager = $compile(pager)(childScope);
						}
						return pager;
					}
				}
  			};
		}])
		.directive('weuiSlide', function() {
			return {
				restrict: 'E',
				require: '?^weuiSlideBox',
				compile: function(element) {
					element.addClass('weui-slider-slide');
				}
			};
		})
		.directive('weuiPager', function() {
			return {
				restrict: 'E',
				replace: true,
				require: '^weuiSlideBox',
				template: '<div class="weui-slider-pager">'+
								'<span class="weui-slider-pager-page" ng-repeat="slide in numSlides() track by $index" ng-class="{active: $index == currentSlide}" ng-click="pagerClick($index)">'+
									'<i class="icon"></i>'+
								'</span>'+
							'</div>',
				link: function($scope, $element, $attr, slideBox) {
					var selectPage = function(index) {
							var children = $element[0].children;
							var length = children.length;
							for (var i = 0; i < length; i++) {
								if (i == index) {
									children[i].classList.add('active');
								} else {
									children[i].classList.remove('active');
								}
							}
						};

					$scope.pagerClick = function(index) {
						slideBox.onPagerClick(index);
					};

					$scope.numSlides = function() {
						return new Array(slideBox.slidesCount());
					};

					$scope.$watch('currentSlide', function(v) {
						selectPage(v);
					});
				}
			};
		})
		.service('$weuiSlideBoxDelegate', DelegateService([
			'update',
			'slide', 
			'select',
			'enableSlide',
			'previous',
			'next',
			'stop', 
			'autoPlay',
			'start',
			'currentIndex', 
			'selected',
			'slidesCount', 
			'count', 
			'loop'
		]))
		.service('$weuiScrollDelegate', DelegateService([
			'resize',
			'scrollTop',
			'scrollBottom',
			'scrollTo',
			'scrollBy',
			'zoomTo',
			'zoomBy',
			'getScrollPosition',
			'anchorScroll',
			'freezeScroll',
			'freezeAllScrolls',
			'getScrollView'
		]));
	
})(); 
(function() {

	// ng-weui-switch	
	angular
		.module('ng-weui-switch', [])
		.directive('weuiSwitch', function(){
			return {
				restrict: 'E',
				replace: true,
				require: '?ngModel',
				transclude: true,
				template: 	'<div class="weui-cell weui-cell_switch">'+
				                '<div class="weui-cell__bd" ng-transclude></div>'+
				                '<div class="weui-cell__ft">'+
				                    '<input class="weui-switch" type="checkbox" name="switch">'+
				                '</div>'+
				            '</div>',
				compile: function(element, attr) {
					var input = element.find('input');
					
					angular.forEach({
						'name': attr.name,
						'ng-value': attr.ngValue,
						'ng-model': attr.ngModel,
						'ng-checked': attr.ngChecked,
						'ng-disabled': attr.ngDisabled,
						'ng-true-value': attr.ngTrueValue,
						'ng-false-value': attr.ngFalseValue,
						'ng-change': attr.ngChange,
						'ng-required': attr.ngRequired,
						'required': attr.required
					}, function(value, name) {
						if (angular.isDefined(value)) {
							input.attr(name, value);
						}
					});
				}
			};
		})
	
})(); 
(function() {

	// ng-weui-templateLoader	
	angular
		.module('ng-weui-templateLoader', [])
		.factory('$weuiTemplateLoader', ['$compile', '$controller', '$http', '$q', '$rootScope', '$templateCache', 
		function($compile, $controller, $http, $q, $rootScope, $templateCache) {
			return {
				load   : fetchTemplate,
				compile: loadAndCompile
			};

			function fetchTemplate(url) {
				return $http.get(url, {cache: $templateCache})
				.then(function(response) {
					return response.data && response.data.trim();
				});
			}

			function loadAndCompile(options) {
				options = angular.extend({
					template   : '',
					templateUrl: '',
					scope      : null,
					controller : null,
					locals     : {},
					appendTo   : null
				}, options || {});

				var templatePromise = options.templateUrl ? this.load(options.templateUrl) : $q.when(options.template);

				return templatePromise.then(function(template) {
					var controller;
					var scope = options.scope || $rootScope.$new();

					//Incase template doesn't have just one root element, do this
					var element = angular.element('<div>').html(template).contents();

					if (options.controller) {
						controller = $controller(
							options.controller,
							angular.extend(options.locals, {
								$scope: scope
							})
						);
						element.children().data('$ngControllerController', controller);
					}

					if (options.appendTo) {
						angular.element(options.appendTo).append(element);
					}

					$compile(element)(scope);

					return {
						element: element,
						scope  : scope
					};
				});
			}
		}])
	
})(); 
(function() {

	// ng-weui-toast	
	angular
		.module('ng-weui-toast', [])
		.directive('weuiToast', ['$document', function($document) {
			 return {
			    restrict: 'E',
			    scope: true,
			    replace: true,
			    template: 	'<div class="ng-weui-toast-wrapper hidden">'+
						        '<div class="weui-toast">'+
						            '<i class="weui-icon-success-no-circle weui-icon_toast"></i>'+
						            '<p class="weui-toast__content" ng-bind="text"></p>'+
						        '</div>'+
						    '</div>',
			    link: function($scope, $element) {
			    }
			}
		}])
		.provider('$weuiToast', function () {
			var TOAST_TYPES = [
				{
					type: 'success',
					cls: 'ng-weui-toast-success'
				},
				{
					type: 'cancel',
					cls: 'ng-weui-toast-cancel'
				},
				{
					type: 'forbidden',
					cls: 'ng-weui-toast-forbidden'
				},
				{
					type: 'text',
					cls: 'ng-weui-toast-text'
				}
			]

	        var defaults = this.defaults = {
	        	type: 'success',
	        	timer: 1500,
	        	text: '已完成',
	        	noBackdrop: true,
	        	success: angular.noop
	        }

	        this.$get = ['$document', '$templateCache', '$compile', '$q', '$http', '$rootScope', '$timeout', '$window', '$controller', '$weuiBackdrop',
            function ($document, $templateCache, $compile, $q, $http, $rootScope, $timeout, $window, $controller, $weuiBackdrop) {
	        	var self   = this,
					$el    = angular.element,
					$body  = $el(document.body),
					extend = angular.extend,
					noop   = angular.noop,
					copy   = angular.copy;

	        	var privateMethods = {
	        		
	        	}

	        	var publicMethods = {
	        		show: function(opts) {
	        			var scope = $rootScope.$new(true);

						extend(scope, copy(defaults), opts || {});

					    var element = scope.element = $compile('<weui-toast></weui-toast>')(scope);

	        			angular.forEach(TOAST_TYPES, function(value, key){
	        				if (value.type === scope.type) {
	        					element.addClass(value.cls)
	        				}
	        			})

					    $body.append(element);

					    if (!scope.noBackdrop) {
							$weuiBackdrop.retain();
							$weuiBackdrop.getElement().addClass('backdrop-toast');
						}

					    element.addClass('visible');
						element[0].offsetWidth;
						element.addClass('active');

					    scope.remove = function(callback) {
					    	$timeout(function() {
					    		if (!scope.noBackdrop) {
									$weuiBackdrop.release();
									$weuiBackdrop.getElement().removeClass('backdrop-toast');
								}

								element.removeClass('visible active');
		        				element.remove();
		        				scope.$destroy();
								(callback || noop)();
		        			}, scope.timer)
						}

						scope.cancel = function() {
							scope.remove(opts.success);
						}

						scope.cancel();
	        		}
	        	}

	        	return publicMethods
	        }]

	        this.setDefaults = function (newDefaults) {
	            angular.extend(defaults, newDefaults);
	        }
	    })
	
})(); 
(function() {

	// ng-weui-toptips	
	angular
		.module('ng-weui-toptips', [])
		.directive('weuiToptips', ['$document', function($document) {
			 return {
			    restrict: 'E',
			    scope: true,
			    replace: true,
			    template: 	'<div class="ng-weui-toptips-wrapper hidden" ng-class="className">'+
						        '<div class="weui-toptips" ng-class="cls">'+
						            '<weui-icon class="weui-toptips_icon" icon="{{icon}}" ng-if="!hidden"></weui-icon>'+
						            '<span ng-bind="text"></span>'+
						        '</div>'+
						    '</div>',
			    link: function($scope, $element) {
			    }
			}
		}])
		.provider('$weuiToptips', function () {
	        var defaults = this.defaults = {
	        	icon: 'cancel',
	        	hidden: true,
	        	text: undefined,
	        	timer: 1500,
	        	className: undefined,
	        	success: angular.noop
	        }

	        this.$get = ['$document', '$templateCache', '$compile', '$q', '$http', '$rootScope', '$timeout', '$window', '$controller', '$weuiBackdrop',
            function ($document, $templateCache, $compile, $q, $http, $rootScope, $timeout, $window, $controller, $weuiBackdrop) {
	        	var self   = this,
					$el    = angular.element,
					$body  = $el(document.body),
					extend = angular.extend,
					noop   = angular.noop,
					copy   = angular.copy;

	        	var privateMethods = {
	        		
	        	}

	        	var publicMethods = {
	        		show: function(opts) {
	        			var scope = $rootScope.$new(true);

						extend(scope, copy(defaults), opts || {});

						scope.cls = scope.icon ? ('weui-toptips_' + scope.icon) : 'weui-toptips_cancel'

					    var element = scope.element = $compile('<weui-toptips></weui-toptips>')(scope);

					    $body.append(element);

					    element.addClass('visible');
						element[0].offsetWidth;
						element.addClass('active');

					    scope.remove = function(callback) {
					    	$timeout(function() {
								element.removeClass('visible active');
		        				element.remove();
		        				scope.$destroy();
								(callback || noop)();
		        			}, scope.timer)
						}

						scope.cancel = function() {
							scope.remove(opts.success);
						}

						scope.cancel();
	        		},
	        		success: function(opts) {
						return this.show(extend(opts, {
							icon: 'success', 
						}))
					},
					info: function(opts) {
						return this.show(extend(opts, {
							icon: 'info', 
						}))
					},
					warn: function(opts) {
						return this.show(extend(opts, {
							icon: 'warn', 
						}))
					},
					error: function(opts) {
						return this.show(extend(opts, {
							icon: 'cancel', 
						}))
					},
	        	}

	        	return publicMethods
	        }]

	        this.setDefaults = function (newDefaults) {
	            angular.extend(defaults, newDefaults);
	        }
	    })
	
})(); 
/**
 * ngWeui v0.0.1
 */
(function() {

	var ngWeui = window.ngWeui || (window.ngWeui = {});

	var iPadAgent 	 = null != navigator.userAgent.match(/iPad/i),
		iPhoneAgent  = null != navigator.userAgent.match(/iPhone/i),
		AndroidAgent = null != navigator.userAgent.match(/Android/i),
		webOSAgent 	 = null != navigator.userAgent.match(/webOS/i),
		WechatAgent  = null != navigator.userAgent.match(/micromessenger/i)

	ngWeui.isIpad    = iPadAgent;
	ngWeui.isIPhone  = iPhoneAgent;
	ngWeui.isAndroid = AndroidAgent;
	ngWeui.isWebOS   = webOSAgent;
	ngWeui.isWechat  = WechatAgent;
	ngWeui.isMobile  = iPadAgent || iPhoneAgent || AndroidAgent || webOSAgent;
	ngWeui.isPC		 = !ngWeui.isMobile;

	ngWeui.version = 'v0.0.1';

	// ng-weui
	angular
		.module('ng-weui', [
			'ng-weui-actionsheet', 
			'ng-weui-backdrop', 
			'ng-weui-blur', 
			'ng-weui-checkbox', 
			'ng-weui-dialog', 
			'ng-weui-fileUpload', 
			'ng-weui-gallery', 
			'ng-weui-icon', 
			'ng-weui-loading', 
			'ng-weui-msg', 
			'ng-weui-panel', 
			'ng-weui-popup', 
			'ng-weui-radio', 
			'ng-weui-slideBox', 
			'ng-weui-switch', 
			'ng-weui-templateLoader', 
			'ng-weui-toast', 
			'ng-weui-toptips', 
		])

})();
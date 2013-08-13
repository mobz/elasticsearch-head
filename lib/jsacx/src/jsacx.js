/**
 * jsacx.js
 * @author the regents of aconex ui
 */

( function() {

var window = this,
	$ = jQuery;

var acx = window.acx = {};

/**
 * generic object iterator
 * @function
 */
acx.each = $.each;

/**
 * object iterator, returns an array with one element for each property of the object
 * @function
 */
acx.eachMap = function(obj, fn, thisp) {
	var ret = [];
	for(var n in obj) {
		ret.push(fn.call(thisp, n, obj[n], obj));
	}
	return ret;
};

/**
 * extends the first argument with the properties of the second and subsequent arguments
 * @function
 */
acx.extend = $.extend;

/**
 * augments the first argument with the properties of the second and subsequent arguments
 * like {@link acx.extend} except that existing properties are not overwritten
 */
acx.augment = function() {
	var args = Array.prototype.slice.call(arguments),
		src = (args.length === 1) ? this : args.shift(),
		augf = function(n, v) {
			if(! (n in src)) {
				src[n] = v;
			}
		};
	for(var i = 0; i < args.length; i++) {
		acx.each(args[i], augf);
	}
	return src;
};

/**
 * tests whether the argument is an array
 * @function
 */
acx.isArray = $.isArray;

/**
 * tests whether the argument is an object
 * @function
 */
acx.isObject = function (value) {
	return Object.prototype.toString.call(value) == "[object Object]";
};

/**
 * tests whether the argument is a function
 * @function
 */
acx.isFunction = $.isFunction;

/**
 * tests whether the argument is a date
 * @function
 */
acx.isDate = function (value) {
	return Object.prototype.toString.call(value) == "[object Date]";
};

/**
 * tests whether the argument is a regexp
 * @function
 */
acx.isRegExp = function (value) {
	return Object.prototype.toString.call(value) == "[object RegExp]";
};

/**
 * tests whether the value is blank or empty
 * @function
 */
acx.isEmpty = function (value, allowBlank) {
	return value === null || value === undefined || ((acx.isArray(value) && !value.length)) || (!allowBlank ? value === '' : false);
};

/**
 * data type for performing chainable geometry calculations<br>
 * can be initialised x,y | {x, y} | {left, top}
 */
acx.vector = function(x, y) {
	return new acx.vector.prototype.Init(x, y);
};

acx.vector.prototype = {
	Init : function(x, y) {
		x = x || 0;
		this.y = isFinite(x.y) ? x.y : (isFinite(x.top) ? x.top : (isFinite(y) ? y : 0));
		this.x = isFinite(x.x) ? x.x : (isFinite(x.left) ? x.left : (isFinite(x) ? x : 0));
	},
	
	add : function(i, j) {
		var d = acx.vector(i, j);
		return new this.Init(this.x + d.x, this.y + d.y);
	},
	
	sub : function(i, j) {
		var d = acx.vector(i, j);
		return new this.Init(this.x - d.x, this.y - d.y);
	},
	
	addX : function(i) {
		return new this.Init(this.x + i, this.y);
	},
	
	addY : function(j) {
		return new this.Init(this.x, this.y + j);
	},

	mod : function(fn) { // runs a function against the x and y values
		return new this.Init({x: fn.call(this, this.x, "x"), y: fn.call(this, this.y, "y")});
	},
	
	/** returns true if this is within a rectangle formed by the points p and q */
	within : function(p, q) {
		return ( this.x >= ((p.x < q.x) ? p.x : q.x) && this.x <= ((p.x > q.x) ? p.x : q.x) &&
				this.y >= ((p.y < q.y) ? p.y : q.y) && this.y <= ((p.y > q.y) ? p.y : q.y) );
	},
	
	asOffset : function() {
		return { top: this.y, left: this.x };
	},
	
	asSize : function() {
		return { height: this.y, width: this.x };
	}
};

acx.vector.prototype.Init.prototype = acx.vector.prototype;

/**
 * short cut functions for working with vectors and jquery.
 * Each function returns the equivalent jquery value in a two dimentional vector
 */
$.fn.vSize = function() { return acx.vector(this.width(), this.height()); };
$.fn.vOuterSize = function(margin) { return acx.vector(this.outerWidth(margin), this.outerHeight(margin)); };
$.fn.vScroll = function() { return acx.vector(this.scrollLeft(), this.scrollTop()); };
$.fn.vOffset = function() { return acx.vector(this.offset()); };
$.fn.vPosition = function() { return acx.vector(this.position()); };
$.Event.prototype.vMouse = function() { return acx.vector(this.pageX, this.pageY); };

/**
 * object extensions (ecma5 compatible)
 */
acx.augment(Object, {
	keys: function(obj) {
		var ret = [];
		for(var n in obj) if(Object.prototype.hasOwnProperty.call(obj, n)) ret.push(n);
		return ret;
	}
});

/**
 * Array prototype extensions
 */
acx.augment(Array.prototype, {
	'contains' : function(needle) {
		return this.indexOf(needle) !== -1;
	},

	// returns a new array consisting of all the members that are in both arrays
	'intersection' : function(b) {
		var ret = [];
		for(var i = 0; i < this.length; i++) {
			if(b.contains(this[i])) {
				ret.push(this[i]);
			}
		}
		return ret;
	},
	
	'remove' : function(value) {
		var i = this.indexOf(value);
		if(i !== -1) {
			this.splice(i, 1);
		}
	}
});

/**
 * String prototype extensions
 */
acx.augment(String.prototype, {
	'contains' : function(needle) {
		return this.indexOf(needle) !== -1;
	},

	'equalsIgnoreCase' : function(match) {
		return this.toLowerCase() === match.toLowerCase();
	},

	'escapeHtml' : function() {
		return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	},

	'escapeJS' : function() {
		var meta = {'"':'\\"', '\\':'\\\\', '/':'\\/', '\b':'\\b', '\f':'\\f', '\n':'\\n', '\r':'\\r', '\t':'\\t'},
			xfrm = function(c) { return meta[c] || "\\u" + c.charCodeAt(0).toString(16).zeroPad(4); };
		return this.replace(new RegExp('(["\\\\\x00-\x1f\x7f-\uffff])', 'g'), xfrm);
	},

	'escapeRegExp' : function() {
		var ret = "", esc = "\\^$*+?.()=|{,}[]-";
		for ( var i = 0; i < this.length; i++) {
			ret += (esc.contains(this.charAt(i)) ? "\\" : "") + this.charAt(i);
		}
		return ret;
	},
	
	'zeroPad' : function(len) {
		return ("0000000000" + this).substring(this.length - len + 10);
	}
});

$.fn.forEach = Array.prototype.forEach;

/**
 * contains a series of flags indicating which browser is in use and the presence of different browser features or bugs<br>
 * Contains the following flags<br>
 * <ul>
 *  <li> all properties from <a href="http://docs.jquery.com/Utilities/jQuery.support">jQuery.support</a>
 *  <li> safari, opera, msie, mozilla - which rendering engine is in use
 *  <li> version - a string in format A.B.C representing the browser version
 *  <li> ie6, ie7 and ie67 shortcuts to determine exact browser
 * </ul>
 * @field
 */
acx.browser = $.support;
acx.extend(acx.browser, $.browser);
acx.browser.major = parseInt(acx.browser.version, 10);
acx.browser.ie6 = acx.browser.msie && acx.browser.major === 6;
acx.browser.ie7 = acx.browser.msie && acx.browser.major === 7;
acx.browser.ie8 = acx.browser.msie && acx.browser.major === 8;
acx.browser.ie9 = acx.browser.msie && acx.browser.major === 9;
acx.browser.ie67 = acx.browser.ie6 || acx.browser.ie7;
acx.browser.ie678 = acx.browser.ie67 || acx.browser.ie8;
$(function() { acx.each($.browser, function(n,v, b) { if(v === true && (b = n.match(/ie$|^moz|^saf/))) { document.body.className += b[0] + " " + b[0] + acx.browser.major; } }) });


/**
 * base class for creating inheritable classes
 * based on resigs 'Simple Javascript Inheritance Class' (based on base2 and prototypejs)
 * modified with static super and auto config
 * @name Class
 * @constructor
 */
(function(){
	var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

	acx.Class = function(){};

	acx.Class.extend = function(prop) {
		function Class() {
			if(!initializing) {
				var args = Array.prototype.slice.call(arguments);
				this.config = $.extend( function(t) { // automatically construct a config object based on defaults and last item passed into the constructor
					return $.extend(t._proto && t._proto() && arguments.callee(t._proto()) || {}, t.defaults);
				} (this) , args.pop() );
				this.init && this.init.apply(this, args); // automatically run the init function when class created
			}
		}

		initializing = true;
		var prototype = new this();
		initializing = false;
		
		var _super = this.prototype;
		prototype._proto = function() {
			return _super;
		};

		for(var name in prop) {
			prototype[name] = typeof prop[name] == "function" && typeof _super[name] == "function" && fnTest.test(prop[name]) ?
				(function(name, fn){
					return function() { this._super = _super[name]; return fn.apply(this, arguments); };
				})(name, prop[name]) : prop[name];
		}

		Class.prototype = prototype;
		Class.constructor = Class;

		Class.extend = arguments.callee; // make class extendable

		return Class;
	};
})();

})();

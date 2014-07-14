(function() {

	var window = this,
		$ = jQuery;

	function ns( namespace ) {
		return (namespace || "").split(".").reduce( function( space, name ) {
			return space[ name ] || ( space[ name ] = { ns: ns } );
		}, this );
	}

	var app = ns("app");

	var acx = ns("acx");

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
	 * augments the first argument with the properties of the second and subsequent arguments
	 * like {@link $.extend} except that existing properties are not overwritten
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
			$.each(args[i], augf);
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

	// joey / jquery integration
	$.joey = function( obj ) {
		return $( window.joey( obj ) );
	};

	window.joey.plugins.push( function( obj ) {
		if( obj instanceof jQuery ) {
			return obj[0];
		}
	});

})();

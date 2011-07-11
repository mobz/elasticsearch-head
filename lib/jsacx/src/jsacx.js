/**
 * jsacx.js
 * @author the regents of aconex ui
 */

( function() {

var window = this,
	$ = jQuery,
	acx = {};

/**
 * global acx namespace
 * @namespace
 * @name acx
 */
window.acx = acx;

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
 * creates and parses a string to a date object
 * @function
 */
acx.parseDate = function(str, fmt, forceStrMonth){
    var fmt = fmt || window.localeDateFormat;
    var mnlu = ([].concat(JSCal.i18n.mn).concat(JSCal.i18n.smn)).map(function(n) { return n.toLowerCase(); });
    var flu = [ ["%y%Y", 1900, 2999, _pY ], ["%m%b%B", 0, 11, _pM ], ["%d%e", 1, 31, _pD ], ["%H%I%k%l", 0, 23, _pT ], ["%M", 0, 59, _pT] ];
    function getFMap(fkey) { return flu.reduce(function(rv, key, i) { return key[0].contains(fkey) ? i : rv; }, null); }
    function _pY(y) { y = parseInt(y, 10); return y + (y < 100 ? Math.floor(((new Date()).getFullYear() + 50 - y) / 100) * 100 : 0); }
    function _pM(m) { return ((!forceStrMonth && parseInt(m, 10)) || 1 + (mnlu.indexOf(m.toLowerCase()) % 12)) -1; }
    function _pD(d) { return parseInt(d, 10); }
    function _pT(t) { tn = parseInt(t, 10); return tn + ((/pm/i.test(t) && tn < 12) ? 12 : 0) + ((/am/i.test(t) && tn > 12) ? -12 : 0); }
    var da = new Date(); date = [0, -1, 0, 0, 0], f = fmt.match(/%./g);
    return ((str.match(/^\d+$/)
        ? (str.match(new RegExp(f.map(function(t) {
            return (t.match(/%y/i) && str.length > (f.length * 2)) ? "(....)" : "(..)"; }).join(""))) || [0, "e"]).slice(1)
        : str.split(/\W/)).reduce(function(good, de, i) {
            var fkey = getFMap(f[i]); if(fkey === null) { return good; }
            date[fkey] = flu[fkey][3](de);
            return good && (date[fkey] >= flu[fkey][1] && date[fkey] <= flu[fkey][2]);
        }, true) && (da.setTime(Date.UTC.apply(null, date)) && da))
            || (!forceStrMonth && acx.parseDate(str, "%m%d%y", true)) || (!forceStrMonth && acx.parseDate(str, "%d%m%y", true));
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

    'filter' : function(fn, thisp) {
        var res = [];
        for (var i = 0, len = this.length; i < len; i++) {
            if (i in this) {
                var val = this[i];
                if (fn.call(thisp, val, i, this)) {
                    res.push(val);
                }
            }
        }
        return res;
    },

    'forEach' : function(fn, thisp) {
        for (var i = 0; i < this.length; i++) {
            if (i in this) {
                fn.call(thisp, this[i], i, this);
            }
        }
    },
    
    'indexOf' : function(needle, from) {
        from = parseInt(from, 10) || 0;
        if (from < 0) {
            from += this.length;
        }
        for (; from < this.length; from++) {
            if (from in this && this[from] === needle) {
                return from;
            }
        }
        return -1;
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
	
	'map' : function(fn, thisp) {
		var ret = [];
		for ( var i = 0; i < this.length; i++) {
			if (i in this) {
				ret[i] = fn.call(thisp, this[i], i, this);
			}
		}
		return ret;
	},

    'reduce' : function(fn, value) {
        var i = 0;
        rv = value;
        if (arguments.length === 1) {
            while (!(i++ in this)) {
            }
            rv = this[i - 1];
        }
        for (; i < this.length; i++) {
            if (i in this) {
                rv = fn.call(null, rv, this[i], i, this);
            }
        }
        return rv;
    },

	'remove' : function(value) {
		var i = this.indexOf(value);
		if(i !== -1) {
			this.splice(i, 1);
		}
	}
});

/**
 * Function prototype extensions
 */
acx.augment(Function.prototype, {
    'bind' : function() {
        var method = this,
        args = Array.prototype.slice.call(arguments),
        obj = args.shift();
        return function() {
            return method.apply(obj, args.concat(Array.prototype.slice.call(arguments)));
        };
    },

    'delay' : function() {
        var method = this,
        args = Array.prototype.slice.call(arguments),
        timeout = args.shift();
        return window.setTimeout( function() {
            return method.apply(method, args);
        }, timeout);
    }
});

/**
 * String prototype extensions
 */
acx.augment(String.prototype, {
    'contains' : function(needle) {
        return this.indexOf(needle) !== -1;
    },

    'trim' : function() {
        return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
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
 * provides text formatting and i18n key storage features<br>
 * implements most of the Sun Java MessageFormat functionality.
 * @see <a href="http://java.sun.com/j2se/1.5.0/docs/api/java/text/MessageFormat.html" target="sun">Sun's Documentation</a>
 * @namespace
 */
acx.i18n = (function() {
    /**
     * the collections of keys in memory
     */
    var keys = {};

    /**
     * formats a message using the provided arguments
     */
    var format = function(message, args) {
        var substitute = function() {
            var format = arguments[1].split(',');
            var substr = escape(args[format.shift()]);
            if(format.length === 0) {
                return substr; // simple substitution eg {0}
            }
            switch(format.shift()) {
                case "number" : return (new Number(substr)).toLocaleString();
                case "date" : return (new Date(+substr)).toLocaleDateString(); // date and time require milliseconds since epoch
                case "time" : return (new Date(+substr)).toLocaleTimeString(); //  eg acx.text("Key", +(new Date())); for current time
            }
            var styles = format.join("").split("|").map(function(style) {
                return style.match(/(-?[\.\d]+)(#|<)([^{}]*)/);
            });
            var match = styles[0][3];
            for(var i=0; i<styles.length; i++) {
                if((styles[i][2] === "#" && (+styles[i][1]) === (+substr)) ||
                        (styles[i][2] === "<" && ((+styles[i][1]) < (+substr)))) {
                    match = styles[i][3];
                }
            }
            return match;
        };

        if(message === undefined) {
            return message;
        }

        // split message into formatting parts (mostly processed by the regexp)
        return message.replace(/'(')|'([^']+)'|([^{']+)|([^']+)/g, function(x, sq, qs, ss, sub) {

            // keep replacing substitutions (recursively) until none remain
            do {} while(sub && (sub !== (sub = (sub.replace(/\{([^{}]+)\}/, substitute)))));

            return sq || qs || ss || unescape(sub);
        });
    };

	return {

		/**
		 * set an i18n key for later use<br>
		 * @function
		 * @name acx.i18n.setKey
		 */
		setKey: function(key, value) {
			keys[key] = value;
		},

		/**
		 * sets a group i18n key for later use<br>
		 * @function
		 * @name acx.i18n.setKeys
		 */
		setKeys: function(strings) {
			for(key in strings) {
				keys[key] = strings[key];
			}
		},
		
		/**
		 * convert an i18n key to text and format using the Java MessageFormat standard <br>
		 * use shortcut {@link acx.text}
		 * @name acx.i18n.formatKey
		 * @function
		 */
		formatKey: function() {
			var args = Array.prototype.slice.call(arguments),
				key = keys[args.shift()];
			if(args.length === 0) {
				return key;
			}
			return format(key, args);
		},

		/**
		 * format a text string using the Java MessageFormat standard
		 * @name acx.i18n.formatText
		 * @function
		 */
		formatText: function(text, args) {
			return format(text, acx.isArray(args) ? args : [args]);
		},

		/**
		 * format a key substituting non-string values. Returns an array
		 * limited to simple substitution types, useful for passing to $.create
		 */
		formatComplex: function(key, args) {
			var args = Array.prototype.slice.call(arguments),
				key = keys[args.shift()],
				ret = [];
			do {} while(key && key !== (key = key.replace(/([^{]+)|\{(\d+)\}/, function(x, pt, sub) {
				ret.push(pt || args[+sub]);
				return "";
			})));
			return ret;
		}
	};
})();

/**
 * shortcut to {@link acx.i18n.formatKey}
 * @function
 */
acx.text = acx.i18n.formatKey;

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

/**
 * base class for creating inheritable classes
 * based on resigs 'Simple Javascript Inheritance Class' (based on base2 and prototypejs)
 * modified with static super and auto config
 * @name Class
 * @constructor
 */
(function( $, app ){

	var ux = app.ns("ux");

	var initializing = false, fnTest = /\b_super\b/;

	ux.Class = function(){};

	ux.Class.extend = function(prop) {
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
			prototype[name] = typeof prop[name] === "function" && typeof _super[name] === "function" && fnTest.test(prop[name]) ?
				(function(name, fn){
					return function() { this._super = _super[name]; return fn.apply(this, arguments); };
				})(name, prop[name]) : prop[name];
		}

		Class.prototype = prototype;
		Class.constructor = Class;

		Class.extend = arguments.callee; // make class extendable

		return Class;
	};
})( this.jQuery, this.app );

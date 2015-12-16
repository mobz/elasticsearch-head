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

(function( app ) {

	var ut = app.ns("ut");

	ut.option_template = function(v) { return { tag: "OPTION", value: v, text: v }; };

	ut.require_template = function(f) { return f.require ? { tag: "SPAN", cls: "require", text: "*" } : null; };


	var sib_prefix = ['B','ki','Mi', 'Gi', 'Ti', 'Pi', 'Ei', 'Zi', 'Yi'];

	ut.byteSize_template = function(n) {
		var i = 0;
		while( n >= 1000 ) {
			i++;
			n /= 1024;
		}
		return (i === 0 ? n.toString() : n.toFixed( 3 - parseInt(n,10).toString().length )) + ( sib_prefix[ i ] || "..E" );
	};

	var sid_prefix = ['','k','M', 'G', 'T', 'P', 'E', 'Z', 'Y'];

	ut.count_template = function(n) {
		var i = 0;
		while( n >= 1000 ) {
			i++;
			n /= 1000;
		}
		return i === 0 ? n.toString() : ( n.toFixed( 3 - parseInt(n,10).toString().length ) + ( sid_prefix[ i ] || "..E" ) );
	};

})( this.app );

(function( app ) {

	var ux = app.ns("ux");

	ux.Observable = ux.Class.extend((function() {
		return {
			init: function() {
				this.observers = {};
				for( var opt in this.config ) { // automatically install observers that are defined in the configuration
					if( opt.indexOf( 'on' ) === 0 ) {
						this.on( opt.substring(2) , this.config[ opt ] );
					}
				}
			},
			_getObs: function( type ) {
				return ( this.observers[ type.toLowerCase() ] || ( this.observers[ type.toLowerCase() ] = [] ) );
			},
			on: function( type, fn, params, thisp ) {
				this._getObs( type ).push( { "cb" : fn, "args" : params || [] , "cx" : thisp || this } );
				return this;
			},
			fire: function( type ) {
				var params = Array.prototype.slice.call( arguments, 1 );
				this._getObs( type ).slice().forEach( function( ob ) {
					ob["cb"].apply( ob["cx"], ob["args"].concat( params ) );
				} );
				return this;
			},
			removeAllObservers: function() {
				this.observers = {};
			},
			removeObserver: function( type, fn ) {
				var obs = this._getObs( type ),
					index = obs.reduce( function(p, t, i) { return (t.cb === fn) ? i : p; }, -1 );
				if(index !== -1) {
					obs.splice( index, 1 );
				}
				return this; // make observable functions chainable
			},
			hasObserver: function( type ) {
				return !! this._getObs( type ).length;
			}
		};
	})());

})( this.app );
(function( app ) {

	var ux = app.ns("ux");

	var extend = ux.Observable.extend;
	var instance = function() {
		if( ! ("me" in this) ) {
			this.me = new this();
		}
		return this.me;
	};

	ux.Singleton = ux.Observable.extend({});

	ux.Singleton.extend = function() {
		var Self = extend.apply( this, arguments );
		Self.instance = instance;
		return Self;
	};

})( this.app );

(function( $, app ) {

	var ux = app.ns("ux");

	/**
	 * Provides drag and drop functionality<br>
	 * a DragDrop instance is created for each usage pattern and then used over and over again<br>
	 * first a dragObj is defined - this is the jquery node that will be dragged around<br>
	 * second, the event callbacks are defined - these allow you control the ui during dragging and run functions when successfully dropping<br>
	 * thirdly drop targets are defined - this is a list of DOM nodes, the constructor works in one of two modes:
	 * <li>without targets - objects can be picked up and dragged around, dragStart and dragStop events fire</li>
	 * <li>with targets - as objects are dragged over targets dragOver, dragOut and DragDrop events fire
	 * to start dragging call the DragDrop.pickup_handler() function, dragging stops when the mouse is released.
	 * @constructor
	 * The following options are supported
	 * <dt>targetSelector</dt>
	 *   <dd>an argument passed directly to jquery to create a list of targets, as such it can be a CSS style selector, or an array of DOM nodes<br>if target selector is null the DragDrop does Drag only and will not fire dragOver dragOut and dragDrop events</dd>
	 * <dt>pickupSelector</dt>
	 *   <dd>a jquery selector. The pickup_handler is automatically bound to matched elements (eg clicking on these elements starts the drag). if pickupSelector is null, the pickup_handler must be manually bound <code>$(el).bind("mousedown", dragdrop.pickup_handler)</code></dd>
	 * <dt>dragObj</dt>
	 *   <dd>the jQuery element to drag around when pickup is called. If not defined, dragObj must be set in onDragStart</dd>
	 * <dt>draggingClass</dt>
	 *   <dd>the class(es) added to items when they are being dragged</dd>
	 * The following observables are supported
	 * <dt>dragStart</dt>
	 *   <dd>a callback when start to drag<br><code>function(jEv)</code></dd>
	 * <dt>dragOver</dt>
	 *   <dd>a callback when we drag into a target<br><code>function(jEl)</code></dd>
	 * <dt>dragOut</dt>
	 *   <dd>a callback when we drag out of a target, or when we drop over a target<br><code>function(jEl)</code></dd>
	 * <dt>dragDrop</dt>
	 *   <dd>a callback when we drop on a target<br><code>function(jEl)</code></dd>
	 * <dt>dragStop</dt>
	 *   <dd>a callback when we stop dragging<br><code>function(jEv)</code></dd>
	 */
	ux.DragDrop = ux.Observable.extend({
		defaults : {
			targetsSelector : null,
			pickupSelector:   null,
			dragObj :         null,
			draggingClass :   "dragging"
		},

		init: function(options) {
			this._super(); // call the class initialiser
		
			this.drag_handler = this.drag.bind(this);
			this.drop_handler = this.drop.bind(this);
			this.pickup_handler = this.pickup.bind(this);
			this.targets = [];
			this.dragObj = null;
			this.dragObjOffset = null;
			this.currentTarget = null;
			if(this.config.pickupSelector) {
				$(this.config.pickupSelector).bind("mousedown", this.pickup_handler);
			}
		},

		drag : function(jEv) {
			jEv.preventDefault();
			var mloc = acx.vector( this.lockX || jEv.pageX, this.lockY || jEv.pageY );
			this.dragObj.css(mloc.add(this.dragObjOffset).asOffset());
			if(this.targets.length === 0) {
				return;
			}
			if(this.currentTarget !== null && mloc.within(this.currentTarget[1], this.currentTarget[2])) {
				return;
			}
			if(this.currentTarget !== null) {
				this.fire('dragOut', this.currentTarget[0]);
				this.currentTarget = null;
			}
			for(var i = 0; i < this.targets.length; i++) {
				if(mloc.within(this.targets[i][1], this.targets[i][2])) {
					this.currentTarget = this.targets[i];
					break;
				}
			}
			if(this.currentTarget !== null) {
				this.fire('dragOver', this.currentTarget[0]);
			}
		},
		
		drop : function(jEv) {
			$(document).unbind("mousemove", this.drag_handler);
			$(document).unbind("mouseup", this.drop_handler);
			this.dragObj.removeClass(this.config.draggingClass);
			if(this.currentTarget !== null) {
				this.fire('dragOut', this.currentTarget[0]);
				this.fire('dragDrop', this.currentTarget[0]);
			}
			this.fire('dragStop', jEv);
			this.dragObj = null;
		},
		
		pickup : function(jEv, opts) {
			$.extend(this.config, opts);
			this.fire('dragStart', jEv);
			this.dragObj = this.dragObj || this.config.dragObj;
			this.dragObjOffset = this.config.dragObjOffset || acx.vector(this.dragObj.offset()).sub(jEv.pageX, jEv.pageY);
			this.lockX = this.config.lockX ? jEv.pageX : 0;
			this.lockY = this.config.lockY ? jEv.pageY : 0;
			this.dragObj.addClass(this.config.draggingClass);
			if(!this.dragObj.get(0).parentNode || this.dragObj.get(0).parentNode.nodeType === 11) { // 11 = document fragment
				$(document.body).append(this.dragObj);
			}
			if(this.config.targetsSelector) {
				this.currentTarget = null;
				var targets = ( this.targets = [] );
				// create an array of elements optimised for rapid collision detection calculation
				$(this.config.targetsSelector).each(function(i, el) {
					var jEl = $(el);
					var tl = acx.vector(jEl.offset());
					var br = tl.add(jEl.width(), jEl.height());
					targets.push([jEl, tl, br]);
				});
			}
			$(document).bind("mousemove", this.drag_handler);
			$(document).bind("mouseup", this.drop_handler);
			this.drag_handler(jEv);
		}
	});

})( this.jQuery, this.app );

(function( app ) {

	var ux = app.ns("ux");

	ux.FieldCollection = ux.Observable.extend({
		defaults: {
			fields: []	// the collection of fields
		},
		init: function() {
			this._super();
			this.fields = this.config.fields;
		},
		validate: function() {
			return this.fields.reduce(function(r, field) {
				return r && field.validate();
			}, true);
		},
		getData: function(type) {
			return this.fields.reduce(function(r, field) {
				r[field.name] = field.val(); return r;
			}, {});
		}
	});

})( this.app );

(function( $, app ) {

	var data = app.ns("data");
	var ux = app.ns("ux");

	data.Model = ux.Observable.extend({
		defaults: {
			data: null
		},
		init: function() {
			this.set( this.config.data );
		},
		set: function( key, value ) {
			if( arguments.length === 1 ) {
				this._data = $.extend( {}, key );
			} else {
				key.split(".").reduce(function( ptr, prop, i, props) {
					if(i === (props.length - 1) ) {
						ptr[prop] = value;
					} else {
						if( !(prop in ptr) ) {
							ptr[ prop ] = {};
						}
						return ptr[prop];
					}
				}, this._data );
			}
		},
		get: function( key ) {
			return key.split(".").reduce( function( ptr, prop ) {
				return ( ptr && ( prop in ptr ) ) ? ptr[ prop ] : undefined;
			}, this._data );
		},
	});
})( this.jQuery, this.app );

(function( app ) {

	var data = app.ns("data");
	var ux = app.ns("ux");

	data.DataSourceInterface = ux.Observable.extend({
		/*
		properties
			meta = { total: 0 },
			headers = [ { name: "" } ],
			data = [ { column: value, column: value } ],
			sort = { column: "name", dir: "desc" }
		events
			data: function( DataSourceInterface )
		 */
		_getSummary: function(res) {
			this.summary = i18n.text("TableResults.Summary", res._shards.successful, res._shards.total, res.hits.total, (res.took / 1000).toFixed(3));
		},
		_getMeta: function(res) {
			this.meta = { total: res.hits.total, shards: res._shards, tool: res.took };
		}
	});

})( this.app );
(function( app ) {

	var data = app.ns("data");

	data.ResultDataSourceInterface = data.DataSourceInterface.extend({
		results: function(res) {
			this._getSummary(res);
			this._getMeta(res);
			this._getData(res);
			this.sort = {};
			this.fire("data", this);
		},
		_getData: function(res) {
			var columns = this.columns = [];
			this.data = res.hits.hits.map(function(hit) {
				var row = (function(path, spec, row) {
					for(var prop in spec) {
						if(acx.isObject(spec[prop])) {
							arguments.callee(path.concat(prop), spec[prop], row);
						} else if(acx.isArray(spec[prop])) {
							if(spec[prop].length) {
								arguments.callee(path.concat(prop), spec[prop][0], row)
							}
						} else {
							var dpath = path.concat(prop).join(".");
							if(! columns.contains(dpath)) {
								columns.push(dpath);
							}
							row[dpath] = (spec[prop] || "null").toString();
						}
					}
					return row;
				})([ hit._type ], hit, {});
				row._source = hit;
				return row;
			}, this);
		}
	});

})( this.app );

(function( app ) {

	/*
	notes on elasticsearch terminology used in this project

	indices[index] contains one or more
	types[type] contains one or more
	documents contain one or more
	paths[path]
	each path contains one element of data
	each path maps to one field

	eg PUT, "/twitter/tweet/1"
	{
		user: "mobz",
		date: "2011-01-01",
		message: "You know, for browsing elasticsearch",
		name: {
			first: "Ben",
			last: "Birch"
		}
	}

	creates
		1 index: twitter
				this is the collection of index data
		1 type: tweet
				this is the type of document (kind of like a table in sql)
		1 document: /twitter/tweet/1
				this is an actual document in the index ( kind of like a row in sql)
		5 paths: [ ["user"], ["date"], ["message"], ["name","first"], ["name","last"] ]
				since documents can be heirarchical this maps a path from a document root to a piece of data
		5 fields: [ "user", "date", "message", "first", "last" ]
				this is an indexed 'column' of data. fields are not heirarchical

		the relationship between a path and a field is called a mapping. mappings also contain a wealth of information about how es indexes the field

	notes
	1) a path is stored as an array, the dpath is  <index> . <type> . path.join("."),
			which can be considered the canonical reference for a mapping
	2) confusingly, es uses the term index for both the collection of indexed data, and the individually indexed fields
			so the term index_name is the same as field_name in this sense.

	*/

	var data = app.ns("data");
	var ux = app.ns("ux");

	var coretype_map = {
		"string" : "string",
		"byte" : "number",
		"short" : "number",
		"long" : "number",
		"integer" : "number",
		"float" : "number",
		"double" : "number",
		"ip" : "number",
		"date" : "date",
		"boolean" : "boolean",
		"binary" : "binary",
		"multi_field" : "multi_field"
	};

	var default_property_map = {
		"string" : { "store" : "no", "index" : "analysed" },
		"number" : { "store" : "no", "precision_steps" : 4 },
		"date" : { "store" : "no", "format" : "dateOptionalTime", "index": "yes", "precision_steps": 4 },
		"boolean" : { "store" : "no", "index": "yes" },
		"binary" : { },
		"multi_field" : { }
	};

	// parses metatdata from a cluster, into a bunch of useful data structures
	data.MetaData = ux.Observable.extend({
		defaults: {
			state: null // (required) response from a /_cluster/state request
		},
		init: function() {
			this._super();
			this.refresh(this.config.state);
		},
		getIndices: function(alias) {
			return alias ? this.aliases[alias] : this.indicesList;
		},
		// returns an array of strings containing all types that are in all of the indices passed in, or all types
		getTypes: function(indices) {
			var indices = indices || [], types = [];
			this.typesList.forEach(function(type) {
				for(var i = 0; i < indices.length; i++) {
					if(! this.indices[indices[i]].types.contains(type))
						return;
				}
				types.push(type);
			}, this);
			return types;
		},
		refresh: function(state) {
			// currently metadata expects all like named fields to have the same type, even when from different types and indices
			var aliases = this.aliases = {};
			var indices = this.indices = {};
			var types = this.types = {};
			var fields = this.fields = {};
			var paths = this.paths = {};

			function createField( mapping, index, type, path, name ) {
				var dpath = [ index, type ].concat( path ).join( "." );
				var field_name = mapping.index_name || path.join( "." );
				var field = paths[ dpath ] = fields[ field_name ] || $.extend({
					field_name : field_name,
					core_type : coretype_map[ mapping.type ],
					dpaths : []
				}, default_property_map[ coretype_map[ mapping.type ] ], mapping );

				if (field.type === "multi_field" && typeof field.fields !== "undefined") {
					for (var subField in field.fields) {
						field.fields[ subField ] = createField( field.fields[ subField ], index, type, path.concat( subField ), name + "." + subField );
					}
				}
				if (fields.dpaths) {
					field.dpaths.push(dpath);
				}
				return field;
			}
			function getFields(properties, type, index, listeners) {
				(function procPath(prop, path) {
					for (var n in prop) {
						if ("properties" in prop[n]) {
							procPath( prop[ n ].properties, path.concat( n ) );
						} else {
							var field = createField(prop[n], index, type, path.concat(n), n);							
							listeners.forEach( function( listener ) {
								listener[ field.field_name ] = field;
							} );
						}
					}
				})(properties, []);
			}
			for (var index in state.metadata.indices) {
				indices[index] = {
					types : [], fields : {}, paths : {}, parents : {}
				};
				indices[index].aliases = state.metadata.indices[index].aliases;
				indices[index].aliases.forEach(function(alias) {
					(aliases[alias] || (aliases[alias] = [])).push(index);
				});
				var mapping = state.metadata.indices[index].mappings;
				for (var type in mapping) {
					indices[index].types.push(type);
					if ( type in types) {
						types[type].indices.push(index);
					} else {
						types[type] = {
							indices : [index], fields : {}
						};
					}
					getFields(mapping[type].properties, type, index, [fields, types[type].fields, indices[index].fields]);
					if ( typeof mapping[type]._parent !== "undefined") {
						indices[index].parents[type] = mapping[type]._parent.type;
					}
				}
			}

			this.aliasesList = Object.keys(aliases);
			this.indicesList = Object.keys(indices);
			this.typesList = Object.keys(types);
			this.fieldsList = Object.keys(fields);
		}
	});

})( this.app );	

(function( app ) {

	var data = app.ns("data");
	var ux = app.ns("ux");

	data.MetaDataFactory = ux.Observable.extend({
		defaults: {
			cluster: null // (required) an app.services.Cluster
		},
		init: function() {
			this._super();
			this.config.cluster.get("_cluster/state", function(data) {
				this.metaData = new app.data.MetaData({state: data});
				this.fire("ready", this.metaData,  { originalData: data }); // TODO originalData needed for legacy ui.FilterBrowser
			}.bind(this));
		}
	});

})( this.app );

(function( app ) {

	var data = app.ns("data");
	var ux = app.ns("ux");

	data.Query = ux.Observable.extend({
		defaults: {
			cluster: null,  // (required) instanceof app.services.Cluster
			size: 50        // size of pages to return
		},
		init: function() {
			this._super();
			this.cluster = this.config.cluster;
			this.refuid = 0;
			this.refmap = {};
			this.indices = [];
			this.types = [];
			this.search = {
				fields : [ "_parent", "_source" ],
				query: { bool: { must: [], must_not: [], should: [] } },
				from: 0,
				size: this.config.size,
				sort: [],
				aggs: {},
				version: true
			};
			this.defaultClause = this.addClause();
			this.history = [ this.getState() ];
		},
		clone: function() {
			var q = new data.Query({ cluster: this.cluster });
			q.restoreState(this.getState());
			for(var uqid in q.refmap) {
				q.removeClause(uqid);
			}
			return q;
		},
		getState: function() {
			return $.extend(true, {}, { search: this.search, indices: this.indices, types: this.types });
		},
		restoreState: function(state) {
			state = $.extend(true, {}, state || this.history[this.history.length - 1]);
			this.indices = state.indices;
			this.types = state.types;
			this.search = state.search;
		},
		getData: function() {
			return JSON.stringify(this.search);
		},
		query: function() {
			var state = this.getState();
			this.cluster.post(
					(this.indices.join(",") || "_all") + "/" + ( this.types.length ? this.types.join(",") + "/" : "") + "_search",
					this.getData(),
					function(results) {
						if(results === null) {
							alert(i18n.text("Query.FailAndUndo"));
							this.restoreState();
							return;
						}
						this.history.push(state);

						this.fire("results", this, results);
					}.bind(this));
		},
		loadParents: function(res,metadata){
			//create data for mget
			var data = { docs :[] };
			var indexToTypeToParentIds = {};
			res.hits.hits.forEach(function(hit) {
			if (typeof hit.fields != "undefined"){
				if (typeof hit.fields._parent != "undefined"){
					var parentType = metadata.indices[hit._index].parents[hit._type];
					if (typeof indexToTypeToParentIds[hit._index] == "undefined"){
						indexToTypeToParentIds[hit._index] = new Object();
					}
					if (typeof indexToTypeToParentIds[hit._index][hit._type] == "undefined"){
						indexToTypeToParentIds[hit._index][hit._type] = new Object();
					}
					if (typeof indexToTypeToParentIds[hit._index][hit._type][hit.fields._parent] == "undefined"){
						indexToTypeToParentIds[hit._index][hit._type][hit.fields._parent] = null;
						data.docs.push({ _index:hit._index, _type:parentType, _id:hit.fields._parent});
					}
				}
			}
		});

		//load parents
		var state = this.getState();
			this.cluster.post("_mget",JSON.stringify(data),
				function(results) {
					if(results === null) {
						alert(i18n.text("Query.FailAndUndo"));
						this.restoreState();
						return;
					}
					this.history.push(state);
					var indexToTypeToParentIdToHit = new Object();
					results.docs.forEach(function(doc) {
						if (typeof indexToTypeToParentIdToHit[doc._index] == "undefined"){
						indexToTypeToParentIdToHit[doc._index] = new Object();
					}
					
					if (typeof indexToTypeToParentIdToHit[doc._index][doc._type] == "undefined"){
						indexToTypeToParentIdToHit[doc._index][doc._type] = new Object();
					}
					
					indexToTypeToParentIdToHit[doc._index][doc._type][doc._id] = doc;
					});
					
					res.hits.hits.forEach(function(hit) {
						if (typeof hit.fields != "undefined"){
							if (typeof hit.fields._parent != "undefined"){
								var parentType = metadata.indices[hit._index].parents[hit._type];
								hit._parent = indexToTypeToParentIdToHit[hit._index][parentType][hit.fields._parent];
							}
						}
					});

					this.fire("resultsWithParents", this, res);
				}.bind(this));
		},
		setPage: function(page) {
			this.search.from = this.config.size * (page - 1);
		},
		setSort: function(index, desc) {
			var sortd = {}; sortd[index] = { reverse: !!desc };
			this.search.sort.unshift( sortd );
			for(var i = 1; i < this.search.sort.length; i++) {
				if(Object.keys(this.search.sort[i])[0] === index) {
					this.search.sort.splice(i, 1);
					break;
				}
			}
		},
		setIndex: function(index, add) {
			if(add) {
				if(! this.indices.contains(index)) this.indices.push(index);
			} else {
				this.indices.remove(index);
			}
			this.fire("setIndex", this, { index: index, add: !!add });
		},
		setType: function(type, add) {
			if(add) {
				if(! this.types.contains(type)) this.types.push(type);
			} else {
				this.types.remove(type);
			}
			this.fire("setType", this, { type: type, add: !!add });
		},
		addClause: function(value, field, op, bool) {
			bool = bool || "should";
			op = op || "match_all";
			field = field || "_all";
			var clause = this._setClause(value, field, op, bool);
			var uqid = "q-" + this.refuid++;
			this.refmap[uqid] = { clause: clause, value: value, field: field, op: op, bool: bool };
			if(this.search.query.bool.must.length + this.search.query.bool.should.length > 1) {
				this.removeClause(this.defaultClause);
			}
			this.fire("queryChanged", this, { uqid: uqid, search: this.search} );
			return uqid; // returns reference to inner query object to allow fast updating
		},
		removeClause: function(uqid) {
			var ref = this.refmap[uqid],
				bool = this.search.query.bool[ref.bool];
			bool.remove(ref.clause);
			if(this.search.query.bool.must.length + this.search.query.bool.should.length === 0) {
				this.defaultClause = this.addClause();
			}
		},
		addAggs: function(aggs) {
			var aggsId = "f-" + this.refuid++;
			this.search.aggs[aggsId] = aggs;
			this.refmap[aggsId] = { aggsId: aggsId, aggs: aggs };
			return aggsId;
		},
		removeAggs: function(aggsId) {
			delete this.search.aggs[aggsId];
			delete this.refmap[aggsId];
		},
		_setClause: function(value, field, op, bool) {
			var clause = {}, query = {};
			if(op === "match_all") {
			} else if(op === "query_string") {
				query["default_field"] = field;
				query["query"] = value;
			} else if(op === "missing") {
				op = "constant_score"
				var missing = {}, filter = {};
				missing["field"] = field;
				filter["missing"] = missing
				query["filter"] = filter;
			} else {
				query[field] = value;
			}
			clause[op] = query;
			this.search.query.bool[bool].push(clause);
			return clause;
		}
	});

})( this.app );

(function( app ) {

	var data = app.ns("data");

	data.QueryDataSourceInterface = data.DataSourceInterface.extend({
		defaults: {
			metadata: null, // (required) instanceof app.data.MetaData, the cluster metadata
			query: null     // (required) instanceof app.data.Query the data source
		},
		init: function() {
			this._super();
			this.config.query.on("results", this._results_handler.bind(this) );
			this.config.query.on("resultsWithParents", this._load_parents.bind(this) );
		},
		_results_handler: function(query, res) {
			this._getSummary(res);
			this._getMeta(res);
			var sort = query.search.sort[0] || { "_score": { reverse: false }};
			var sortField = Object.keys(sort)[0];
			this.sort = { column: sortField, dir: (sort[sortField].reverse ? "asc" : "desc") };
			this._getData(res, this.config.metadata);
			this.fire("data", this);
		},
		_load_parents: function(query, res) {
			query.loadParents(res, this.config.metadata);
		},
		_getData: function(res, metadata) {
			var metaColumns = ["_index", "_type", "_id", "_score"];
			var columns = this.columns = [].concat(metaColumns);

			this.data = res.hits.hits.map(function(hit) {
				var row = (function(path, spec, row) {
					for(var prop in spec) {
						if(acx.isObject(spec[prop])) {
							arguments.callee(path.concat(prop), spec[prop], row);
						} else if(acx.isArray(spec[prop])) {
							if(spec[prop].length) {
								arguments.callee(path.concat(prop), spec[prop][0], row)
							}
						} else {
							var dpath = path.concat(prop).join(".");
							if(metadata.paths[dpath]) {
								var field_name = metadata.paths[dpath].field_name;
								if(! columns.contains(field_name)) {
									columns.push(field_name);
								}
								row[field_name] = (spec[prop] === null ? "null" : spec[prop] ).toString();
							} else {
								// TODO: field not in metadata index
							}
						}
					}
					return row;
				})([ hit._index, hit._type ], hit._source, {});
				metaColumns.forEach(function(n) { row[n] = hit[n]; });
				row._source = hit;
				if (typeof hit._parent!= "undefined") {
					(function(prefix, path, spec, row) {
					for(var prop in spec) {
						if(acx.isObject(spec[prop])) {
							arguments.callee(prefix, path.concat(prop), spec[prop], row);
						} else if(acx.isArray(spec[prop])) {
							if(spec[prop].length) {
								arguments.callee(prefix, path.concat(prop), spec[prop][0], row)
							}
						} else {
							var dpath = path.concat(prop).join(".");
							if(metadata.paths[dpath]) {
								var field_name = metadata.paths[dpath].field_name;
								var column_name = prefix+"."+field_name;
								if(! columns.contains(column_name)) {
									columns.push(column_name);
								}
								row[column_name] = (spec[prop] === null ? "null" : spec[prop] ).toString();
							} else {
								// TODO: field not in metadata index
							}
						}
					}
					})(hit._parent._type,[hit._parent._index, hit._parent._type], hit._parent._source, row);
				}
				return row;
			}, this);
		}
	});

})( this.app );

(function( app ) {

	var data = app.ns("data");
	var ux = app.ns("ux");

	data.BoolQuery = ux.Observable.extend({
		defaults: {
			size: 50		// size of pages to return
		},
		init: function() {
			this._super();
			this.refuid = 0;
			this.refmap = {};
			this.search = {
				query: { bool: { must: [], must_not: [], should: [] } },
				from: 0,
				size: this.config.size,
				sort: [],
				aggs: {}
			};
			this.defaultClause = this.addClause();
		},
		setSize: function(size) {
			this.search.size = parseInt( size, 10 );
		},
		setPage: function(page) {
			this.search.from = this.config.size * (page - 1) + 1;
		},
		addClause: function(value, field, op, bool) {
			bool = bool || "should";
			op = op || "match_all";
			field = field || "_all";
			var clause = this._setClause(value, field, op, bool);
			var uqid = "q-" + this.refuid++;
			this.refmap[uqid] = { clause: clause, value: value, field: field, op: op, bool: bool };
			if(this.search.query.bool.must.length + this.search.query.bool.should.length > 1) {
				this.removeClause(this.defaultClause);
			}
			this.fire("queryChanged", this, { uqid: uqid, search: this.search} );
			return uqid; // returns reference to inner query object to allow fast updating
		},
		removeClause: function(uqid) {
			var ref = this.refmap[uqid],
				bool = this.search.query.bool[ref.bool];
			var clauseIdx = bool.indexOf(ref.clause);
			// Check that this clause hasn't already been removed
			if (clauseIdx >=0) {
				bool.splice(clauseIdx, 1);
			}
		},
		_setClause: function(value, field, op, bool) {
			var clause = {}, query = {};
			if(op === "match_all") {
			} else if(op === "query_string") {
				query["default_field"] = field;
				query["query"] = value;
			} else if(op === "missing") {
				op = "constant_score"
				var missing = {}, filter = {};
				missing["field"] = field;
				filter["missing"] = missing
				query["filter"] = filter;
			} else {
				query[field.substring(field.indexOf(".")+1)] = value;
			}
			clause[op] = query;
			this.search.query.bool[bool].push(clause);
			return clause;
		},
		getData: function() {
			return JSON.stringify(this.search);
		}
	});

})( this.app );
(function( app ) {
	
	var ux = app.ns("ux");
	var services = app.ns("services");

	services.Preferences = ux.Singleton.extend({
		init: function() {
			this._storage = window.localStorage;
			this._setItem("__version", 1 );
		},
		get: function( key ) {
			return this._getItem( key );
		},
		set: function( key, val ) {
			return this._setItem( key, val );
		},
		_getItem: function( key ) {
			try {
				return JSON.parse( this._storage.getItem( key ) );
			} catch(e) {
				console.warn( e );
				return undefined;
			}
		},
		_setItem: function( key, val ) {
			try {
				return this._storage.setItem( key, JSON.stringify( val ) );
			} catch(e) {
				console.warn( e );
				return undefined;
			}
		}
	});

})( this.app );

(function( $, app ) {

	var services = app.ns("services");
	var ux = app.ns("ux");

	function parse_version( v ) {
		return v.match(/^(\d+)\.(\d+)\.(\d+)/).slice(1,4).map( function(d) { return parseInt(d || 0, 10); } );
	}

	services.Cluster = ux.Class.extend({
		defaults: {
			base_uri: null
		},
		init: function() {
			this.base_uri = this.config.base_uri;
		},
		setVersion: function( v ) {
			this.version = v;
			this._version_parts = parse_version( v );
		},
		versionAtLeast: function( v ) {
			var testVersion = parse_version( v );
			for( var i = 0; i < 3; i++ ) {
				if( testVersion[i] !== this._version_parts[i] ) {
					return testVersion[i] < this._version_parts[i];
				}
			}
			return true;
		},
		request: function( params ) {
			return $.ajax( $.extend({
				url: this.base_uri + params.path,
				dataType: "json",
				error: function(xhr, type, message) {
					if("console" in window) {
						console.log({ "XHR Error": type, "message": message });
					}
				}
			},  params) );
		},
		"get": function(path, success) { return this.request( { type: "GET", path: path, success: success } ); },
		"post": function(path, data, success) { return this.request( { type: "POST", path: path, data: data, success: success } ); },
		"put": function(path, data, success) { return this.request( { type: "PUT", path: path, data: data, success: success } ); },
		"delete": function(path, data, success) { return this.request( { type: "DELETE", path: path, data: data, success: success } ); }
	});

})( this.jQuery, this.app );

(function( app ) {

	var services = app.ns("services");
	var ux = app.ns("ux");

	services.ClusterState = ux.Observable.extend({
		defaults: {
			cluster: null
		},
		init: function() {
			this._super();
			this.cluster = this.config.cluster;
			this.clusterState = null;
			this.status = null;
			this.nodeStats = null;
			this.clusterNodes = null;
		},
		refresh: function() {
			var self = this, clusterState, status, nodeStats, clusterNodes, clusterHealth;
			function updateModel() {
				if( clusterState && status && nodeStats && clusterNodes && clusterHealth ) {
					this.clusterState = clusterState;
					this.status = status;
					this.nodeStats = nodeStats;
					this.clusterNodes = clusterNodes;
					this.clusterHealth = clusterHealth;
					this.fire( "data", this );
				}
			}
			this.cluster.get("_cluster/state", function( data ) {
				clusterState = data;
				updateModel.call( self );
			});
			this.cluster.get("_stats", function( data ) {
				status = data;
				updateModel.call( self );
			});
			this.cluster.get("_nodes/stats?all=true", function( data ) {
				nodeStats = data;
				updateModel.call( self );
			});
			this.cluster.get("_nodes", function( data ) {
				clusterNodes = data;
				updateModel.call( self );
			});
			this.cluster.get("_cluster/health", function( data ) {
				clusterHealth = data;
				updateModel.call( self );
			});
		},
		_clusterState_handler: function(state) {
			this.clusterState = state;
			this.redraw("clusterState");
		},
		_status_handler: function(status) {
			this.status = status;
			this.redraw("status");
		},
		_clusterNodeStats_handler: function(stats) {
			this.nodeStats = stats;
			this.redraw("nodeStats");
		},
		_clusterNodes_handler: function(nodes) {
			this.clusterNodes = nodes;
			this.redraw("clusterNodes");
		},
		_clusterHealth_handler: function(health) {
			this.clusterHealth = health;
			this.redraw("status");
		}
	});

})( this.app );
(function( $, joey, app ) {

	var ui = app.ns("ui");
	var ux = app.ns("ux");

	ui.AbstractWidget = ux.Observable.extend({
		defaults : {
			id: null     // the id of the widget
		},

		el: null,       // this is the jquery wrapped dom element(s) that is the root of the widget

		init: function() {
			this._super();
			for(var prop in this) {       // automatically bind all the event handlers
				if(prop.contains("_handler")) {
					this[prop] = this[prop].bind(this);
				}
			}
		},

		id: function(suffix) {
			return this.config.id ? (this.config.id + (suffix ? "-" + suffix : "")) : undefined;
		},

		attach: function( parent, method ) {
			if( parent ) {
				this.el[ method || "appendTo"]( parent );
			}
			this.fire("attached", this );
			return this;
		},

		remove: function() {
			this.el.remove();
			this.fire("removed", this );
			this.removeAllObservers();
			this.el = null;
			return this;
		}
	});

	joey.plugins.push( function( obj ) {
		if( obj instanceof ui.AbstractWidget ) {
			return obj.el[0];
		}
	});

})( this.jQuery, this.joey, this.app );

(function( $, app, joey ) {

	var ui = app.ns("ui");

	ui.AbstractField = ui.AbstractWidget.extend({

		defaults: {
			name : "",			// (required) - name of the field
			require: false,	// validation requirements (false, true, regexp, function)
			value: "",			// default value
			label: ""				// human readable label of this field
		},

		init: function(parent) {
			this._super();
			this.el = $.joey(this._main_template());
			this.field = this.el.find("[name="+this.config.name+"]");
			this.label = this.config.label;
			this.require = this.config.require;
			this.name = this.config.name;
			this.val( this.config.value );
			this.attach( parent );
		},

		val: function( val ) {
			if(val === undefined) {
				return this.field.val();
			} else {
				this.field.val( val );
				return this;
			}
		},

		validate: function() {
			var val = this.val(), req = this.require;
			if( req === false ) {
				return true;
			} else if( req === true ) {
				return val.length > 0;
			} else if( req.test && $.isFunction(req.test) ) {
				return req.test( val );
			} else if( $.isFunction(req) ) {
				return req( val, this );
			}
		}

	});

})( this.jQuery, this.app, this.joey );

(function( app ) {

	var ui = app.ns("ui");

	ui.TextField = ui.AbstractField.extend({
		init: function() {
			this._super();
		},
		_keyup_handler: function() {
			this.fire("change", this );
		},
		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "uiField uiTextField", children: [
				{ tag: "INPUT",
					type: "text",
					name: this.config.name,
					placeholder: this.config.placeholder,
					onkeyup: this._keyup_handler
				}
			]};
		}
	});

})( this.app );

(function( app ) {

	var ui = app.ns("ui");

	ui.CheckField = ui.AbstractField.extend({
		_main_template: function() { return (
			{ tag: "DIV", id: this.id(), cls: "uiCheckField", children: [
				{ tag: "INPUT", type: "checkbox", name: this.config.name, checked: !!this.config.value }
			] }
		); },
		validate: function() {
			return this.val() || ( ! this.require );
		},
		val: function( val ) {
			if( val === undefined ) {
				return !!this.field.attr( "checked" );
			} else {
				this.field.attr( "checked", !!val );
			}
		}
	});

})( this.app );



(function( $, joey, app ) {

	var ui = app.ns("ui");

	ui.Button = ui.AbstractWidget.extend({
		defaults : {
			label: "",                 // the label text
			disabled: false,           // create a disabled button
			autoDisable: false         // automatically disable the button when clicked
		},

		_baseCls: "uiButton",

		init: function(parent) {
			this._super();
			this.el = $.joey(this.button_template())
				.bind("click", this.click_handler);
			this.config.disabled && this.disable();
			this.attach( parent );
		},

		click_handler: function(jEv) {
			if(! this.disabled) {
				this.fire("click", jEv, this);
				this.config.autoDisable && this.disable();
			}
		},

		enable: function() {
			this.el.removeClass("disabled");
			this.disabled = false;
			return this;
		},

		disable: function(disable) {
			if(disable === false) {
					return this.enable();
			}
			this.el.addClass("disabled");
			this.disabled = true;
			return this;
		},

		button_template: function() { return (
			{ tag: 'BUTTON', type: 'button', id: this.id(), cls: this._baseCls, children: [
				{ tag: 'DIV', cls: 'uiButton-content', children: [
					{ tag: 'DIV', cls: 'uiButton-label', text: this.config.label }
				] }
			] }
		); }
	});

})( this.jQuery, this.joey, this.app );

(function( $, app ) {

	var ui = app.ns("ui");

	ui.MenuButton = app.ui.Button.extend({
		defaults: {
			menu: null
		},
		_baseCls: "uiButton uiMenuButton",
		init: function(parent) {
			this._super(parent);
			this.menu = this.config.menu;
			this.on("click", this.openMenu_handler);
			this.menu.on("open", function() { this.el.addClass("active"); }.bind(this));
			this.menu.on("close", function() { this.el.removeClass("active"); }.bind(this));
		},
		openMenu_handler: function(jEv) {
			this.menu && this.menu.open(jEv);
		}
	});

})( this.jQuery, this.app );

(function( $, app ) {

	var ui = app.ns("ui");

	ui.SplitButton = ui.AbstractWidget.extend({
		defaults: {
			items: [],
			label: ""
		},
		_baseCls: "uiSplitButton",
		init: function( parent ) {
			this._super( parent );
			this.value = null;
			this.button = new ui.Button({
				label: this.config.label,
				onclick: this._click_handler
			});
			this.menu = new ui.SelectMenuPanel({
				value: this.config.value,
				items: this._getItems(),
				onSelect: this._select_handler
			});
			this.menuButton = new ui.MenuButton({
				label: "\u00a0",
				menu: this.menu
			});
			this.el = $.joey(this._main_template());
		},
		remove: function() {
			this.menu.remove();
		},
		disable: function() {
			this.button.disable();
		},
		enable: function() {
			this.button.enable();
		},
		_click_handler: function() {
			this.fire("click", this, { value: this.value } );
		},
		_select_handler: function( panel, event ) {
			this.fire( "select", this, event );
		},
		_getItems: function() {
			return this.config.items;
		},
		_main_template: function() {
			return { tag: "DIV", cls: this._baseCls, children: [
				this.button, this.menuButton
			] };
		}
	});

})( this.jQuery, this.app );

(function( $, app, i18n ) {

	var ui = app.ns("ui");

	ui.RefreshButton = ui.SplitButton.extend({
		defaults: {
			timer: -1
		},
		init: function( parent ) {
			this.config.label = i18n.text("General.RefreshResults");
			this._super( parent );
			this.set( this.config.timer );
		},
		set: function( value ) {
			this.value = value;
			window.clearInterval( this._timer );
			if( this.value > 0 ) {
				this._timer = window.setInterval( this._refresh_handler, this.value );
			}
		},
		_click_handler: function() {
			this._refresh_handler();
		},
		_select_handler: function( el, event ) {
			this.set( event.value );
			this.fire("change", this );
		},
		_refresh_handler: function() {
			this.fire("refresh", this );
		},
		_getItems: function() {
			return [
				{ text: i18n.text("General.ManualRefresh"), value: -1 },
				{ text: i18n.text("General.RefreshQuickly"), value: 100 },
				{ text: i18n.text("General.Refresh5seconds"), value: 5000 },
				{ text: i18n.text("General.Refresh1minute"), value: 60000 }
			];
		}
	});

})( this.jQuery, this.app, this.i18n );

(function( $, app ) {

	var ui = app.ns("ui");

	ui.Toolbar = ui.AbstractWidget.extend({
		defaults: {
			label: "",
			left: [],
			right: []
		},
		init: function(parent) {
			this._super();
			this.el = $.joey(this._main_template());
		},
		_main_template: function() {
			return { tag: "DIV", cls: "uiToolbar", children: [
				{ tag: "DIV", cls: "pull-left", children: [
					{ tag: "H2", text: this.config.label }
				].concat(this.config.left) },
				{ tag: "DIV", cls: "pull-right", children: this.config.right }
			]};
		}
	});

})( this.jQuery, this.app );

(function( $, app ) {

	var ui = app.ns("ui");

	ui.AbstractPanel = ui.AbstractWidget.extend({
		defaults: {
			body: null,            // initial content of the body
			modal: true,           // create a modal panel - creates a div that blocks interaction with page
			height: 'auto',        // panel height
			width: 400,            // panel width (in pixels)
			open: false,           // show the panel when it is created
			parent: 'BODY',        // node that panel is attached to
			autoRemove: false      // remove the panel from the dom and destroy it when the widget is closed
		},
		shared: {  // shared data for all instances of ui.Panel and decendants
			stack: [], // array of all open panels
			modal: $( { tag: "DIV", id: "uiModal", css: { opacity: 0.2, position: "absolute", top: "0px", left: "0px" } } )
		},
		init: function() {
			this._super();
		},
		open: function( ev ) {
			this.el
				.css( { visibility: "hidden" } )
				.appendTo( this.config.parent )
				.css( this._getPosition( ev ) )
				.css( { zIndex: (this.shared.stack.length ? (+this.shared.stack[this.shared.stack.length - 1].el.css("zIndex") + 10) : 100) } )
				.css( { visibility: "visible", display: "block" } );
			this.shared.stack.remove(this);
			this.shared.stack.push(this);
			this._setModal();
			$(document).bind("keyup", this._close_handler );
			this.fire("open", { source: this, event: ev } );
			return this;
		},
		close: function() {
			var index = this.shared.stack.indexOf(this);
			if(index !== -1) {
				this.shared.stack.splice(index, 1);
				this.el.css( { left: "-2999px" } ); // move the dialog to the left rather than hiding to prevent ie6 rendering artifacts
				this._setModal();
				this.fire("close", this );
				if(this.config.autoRemove) {
					this.remove();
				}
			}
			return this;
		},
		// close the panel and remove it from the dom, destroying it (you can not reuse the panel after calling remove)
		remove: function() {
			this.close();
			$(document).unbind("keyup", this._close_handler );
			this._super();
		},
		// starting at the top of the stack, find the first panel that wants a modal and put it just underneath, otherwise remove the modal
		_setModal: function() {
			for(var stackPtr = this.shared.stack.length - 1; stackPtr >= 0; stackPtr--) {
				if(this.shared.stack[stackPtr].config.modal) {
					this.shared.modal
						.appendTo( document.body )
						.css( { zIndex: this.shared.stack[stackPtr].el.css("zIndex") - 5 } )
						.css( $(document).vSize().asSize() );
					return;
				}
			}
			this.shared.modal.remove(); // no panels that want a modal were found
		},
		_getPosition: function() {
			return $(window).vSize()                        // get the current viewport size
				.sub(this.el.vSize())                         // subtract the size of the panel
				.mod(function(s) { return s / 2; })           // divide by 2 (to center it)
				.add($(document).vScroll())                   // add the current scroll offset
				.mod(function(s) { return Math.max(5, s); })  // make sure the panel is not off the edge of the window
				.asOffset();                                  // and return it as a {top, left} object
		},
		_close_handler: function( ev ) {
			if( ev.type === "keyup" && ev.keyCode !== 27) { return; } // press esc key to close
			$(document).unbind("keyup", this._close_handler);
			this.close( ev );
		}
	});

})( this.jQuery, this.app );

(function( $, app ) {

	var ui = app.ns("ui");

	ui.DraggablePanel = ui.AbstractPanel.extend({
		defaults: {
	//		title: ""   // (required) text for the panel title
		},

		_baseCls: "uiPanel",

		init: function() {
			this._super();
			this.body = $(this._body_template());
			this.title = $(this._title_template());
			this.el = $.joey( this._main_template() );
			this.el.css( { width: this.config.width } );
			this.dd = new app.ux.DragDrop({
				pickupSelector: this.el.find(".uiPanel-titleBar"),
				dragObj: this.el
			});
			// open the panel if set in configuration
			this.config.open && this.open();
		},

		setBody: function(body) {
				this.body.empty().append(body);
		},
		_body_template: function() { return { tag: "DIV", cls: "uiPanel-body", css: { height: this.config.height + (this.config.height === 'auto' ? "" : "px" ) }, children: [ this.config.body ] }; },
		_title_template: function() { return { tag: "SPAN", cls: "uiPanel-title", text: this.config.title }; },
		_main_template: function() { return (
			{ tag: "DIV", id: this.id(), cls: this._baseCls, children: [
				{ tag: "DIV", cls: "uiPanel-titleBar", children: [
					{ tag: "DIV", cls: "uiPanel-close", onclick: this._close_handler, text: "x" },
					this.title
				]},
				this.body
			] }
		); }
	});

})( this.jQuery, this.app );

(function( app ) {

	var ui = app.ns("ui");

	ui.InfoPanel = ui.DraggablePanel.extend({
		_baseCls: "uiPanel uiInfoPanel"
	});

})( this.app );

(function( app ) {

	var ui = app.ns("ui");

	ui.DialogPanel = ui.DraggablePanel.extend({
		_commit_handler: function(jEv) {
			this.fire("commit", this, { jEv: jEv });
		},
		_main_template: function() {
			var t = this._super();
			t.children.push(this._actionsBar_template());
			return t;
		},
		_actionsBar_template: function() {
			return { tag: "DIV", cls: "pull-right", children: [
				new app.ui.Button({ label: "Cancel", onclick: this._close_handler }),
				new app.ui.Button({ label: "OK", onclick: this._commit_handler })
			]};
		}
	});

})( this.app );

(function( app ) {

	var ui = app.ns("ui");

	ui.MenuPanel = ui.AbstractPanel.extend({
		defaults: {
			items: [],		// (required) an array of menu items
			modal: false
		},
		_baseCls: "uiMenuPanel",
		init: function() {
			this._super();
			this.el = $(this._main_template());
		},
		open: function(jEv) {
			this._super(jEv);
			var cx = this; setTimeout(function() { $(document).bind("click", cx._close_handler); }, 50);
		},
		_getItems: function() {
			return this.config.items;
		},
		_close_handler: function(jEv) {
			this._super(jEv);
			$(document).unbind("click", this._close_handler);
		},
		_main_template: function() {
			return { tag: "DIV", cls: this._baseCls, children: this._getItems().map(this._menuItem_template, this) };
		},
		_menuItem_template: function(item) {
			var dx = item.disabled ? { onclick: function() {} } : {};
			return { tag: "LI", cls: "uiMenuPanel-item" + (item.disabled ? " disabled" : "") + (item.selected ? " selected" : ""), children: [ $.extend({ tag: "DIV", cls: "uiMenuPanel-label" }, item, dx ) ] };
		},
		_getPosition: function(jEv) {
			var right = !! $(jEv.target).parents(".pull-right").length;
			var parent = $(jEv.target).closest("BUTTON");
			return parent.vOffset()
				.addY(parent.vSize().y)
				.addX( right ? parent.vSize().x - this.el.vOuterSize().x : 0 )
				.asOffset();
		}
	});

})( this.app );

(function( app ) {

	var ui = app.ns("ui");

	ui.SelectMenuPanel = ui.MenuPanel.extend({
		defaults: {
			items: [],		// (required) an array of menu items
			value: null
		},
		_baseCls: "uiSelectMenuPanel uiMenuPanel",
		init: function() {
			this.value = this.config.value;
			this._super();
		},
		_getItems: function() {
			return this.config.items.map( function( item ) {
				return {
					text: item.text,
					selected: this.value === item.value,
					onclick: function( jEv ) {
						var el = $( jEv.target ).closest("LI");
						el.parent().children().removeClass("selected");
						el.addClass("selected");
						this.fire( "select", this, { value: item.value } );
						this.value = item.value;
					}.bind(this)
				};
			}, this );

		}
	});

})( this.app );

( function( $, app ) {

	var ui = app.ns("ui");

	ui.Table = ui.AbstractWidget.extend({
		defaults: {
			store: null, // (required) implements interface app.data.DataSourceInterface
			height: 0,
			width: 0
		},
		_baseCls: "uiTable",
		init: function(parent) {
			this._super();
			this.initElements(parent);
			this.config.store.on("data", this._data_handler);
		},
		attach: function(parent) {
			if(parent) {
				this._super(parent);
				this._reflow();
			}
		},
		initElements: function(parent) {
			this.el = $.joey(this._main_template());
			this.body = this.el.find(".uiTable-body");
			this.headers = this.el.find(".uiTable-headers");
			this.tools = this.el.find(".uiTable-tools");
			this.attach( parent );
		},
		_data_handler: function(store) {
			this.tools.text(store.summary);
			this.headers.empty().append(this._header_template(store.columns));
			this.body.empty().append(this._body_template(store.data, store.columns));
			this._reflow();
		},
		_reflow: function() {
			var firstCol = this.body.find("TR:first TH.uiTable-header-cell > DIV"),
					headers = this.headers.find("TR:first TH.uiTable-header-cell > DIV");
			for(var i = 0; i < headers.length; i++) {
				$(headers[i]).width( $(firstCol[i]).width() );
			}
			this._scroll_handler();
		},
		_scroll_handler: function(ev) {
			this.el.find(".uiTable-headers").scrollLeft(this.body.scrollLeft());
		},
		_dataClick_handler: function(ev) {
			var row = $(ev.target).closest("TR");
			if(row.length) {
				this.fire("rowClick", this, { row: row } );
			}
		},
		_headerClick_handler: function(ev) {
			var header = $(ev.target).closest("TH.uiTable-header-cell");
			if(header.length) {
				this.fire("headerClick", this, { header: header, column: header.data("column"), dir: header.data("dir") });
			}
		},
		_main_template: function() {
			return { tag: "DIV", id: this.id(), css: { width: this.config.width + "px" }, cls: this._baseCls, children: [
				{ tag: "DIV", cls: "uiTable-tools" },
				{ tag: "DIV", cls: "uiTable-headers", onclick: this._headerClick_handler },
				{ tag: "DIV", cls: "uiTable-body",
					onclick: this._dataClick_handler,
					onscroll: this._scroll_handler,
					css: { height: this.config.height + "px", width: this.config.width + "px" }
				}
			] };
		},
		_header_template: function(columns) {
			var ret = { tag: "TABLE", children: [ this._headerRow_template(columns) ] };
			ret.children[0].children.push(this._headerEndCap_template());
			return ret;
		},
		_headerRow_template: function(columns) {
			return { tag: "TR", cls: "uiTable-header-row", children: columns.map(function(column) {
				var dir = ((this.config.store.sort.column === column) && this.config.store.sort.dir) || "none";
				return { tag: "TH", data: { column: column, dir: dir }, cls: "uiTable-header-cell" + ((dir !== "none") ? " uiTable-sort" : ""), children: [
					{ tag: "DIV", children: [
						{ tag: "DIV", cls: "uiTable-headercell-menu", text: dir === "asc" ? "\u25b2" : "\u25bc" },
						{ tag: "DIV", cls: "uiTable-headercell-text", text: column }
					]}
				]};
			}, this)};
		},
		_headerEndCap_template: function() {
			return { tag: "TH", cls: "uiTable-headerEndCap", children: [ { tag: "DIV" } ] };
		},
		_body_template: function(data, columns) {
			return { tag: "TABLE", children: []
				.concat(this._headerRow_template(columns))
				.concat(data.map(function(row) {
					return { tag: "TR", data: { row: row }, cls: "uiTable-row", children: columns.map(function(column){
						return { tag: "TD", cls: "uiTable-cell", children: [ { tag: "DIV", text: (row[column] || "").toString() } ] };
					})};
				}))
			};
		}

	});

})( this.jQuery, this.app );

( function( $, app, joey ) {

	var ui = app.ns("ui");

	var CELL_SEPARATOR = ",";
	var CELL_QUOTE = '"';
	var LINE_SEPARATOR = "\r\n";

	ui.CSVTable = ui.AbstractWidget.extend({
		defaults: {
			results: null
		},
		_baseCls: "uiCSVTable",
		init: function( parent ) {
			this._super();
			var results = this.config.results.hits.hits;
			var columns = this._parseResults( results );
			this._downloadButton = new ui.Button({
				label: "Generate Download Link",
				onclick: this._downloadLinkGenerator_handler
			});
			this._downloadLink = $.joey( { tag: "A", text: "download", });
			this._downloadLink.hide();
			this._csvText = this._csv_template( columns, results );
			this.el = $.joey( this._main_template() );
			this.attach( parent );
		},
		_downloadLinkGenerator_handler: function() {
			var csvData = new Blob( [ this._csvText ], { type: 'text/csv' });
			var csvURL = URL.createObjectURL( csvData );
			this._downloadLink.attr( "href", csvURL );
			this._downloadLink.show();
		},
		_parseResults: function( results ) {
			var columnPaths = {};
			(function parse( path, obj ) {
				if( obj instanceof Array ) {
					for( var i = 0; i < obj.length; i++ ) {
						parse( path, obj[i] );
					}
				} else if( typeof obj === "object" ) {
					for( var prop in obj ) {
						parse( path + "." + prop, obj[ prop ] );
					}
				} else {
					columnPaths[ path ] = true;
				}
			})( "root", results );
			var columns = [];
			for( var column in columnPaths ) {
				columns.push( column.split(".").slice(1) );
			}
			return columns;
		},
		_main_template: function() { return (
			{ tag: "DIV", cls: this._baseCls, id: this.id(), children: [
				this._downloadButton,
				this._downloadLink,
				{ tag: "PRE", text: this._csvText }
			] }
		); },
		_csv_template: function( columns, results ) {
			return this._header_template( columns ) + LINE_SEPARATOR + this._results_template( columns, results );
		},
		_header_template: function( columns ) {
			return columns.map( function( column ) {
				return column.join(".");
			}).join( CELL_SEPARATOR );
		},
		_results_template: function( columns, results ) {
			return results.map( function( result ) {
				return columns.map( function( column ) {
					var l = 0,
						ptr = result;
					while( l !== column.length && ptr != null ) {
						ptr = ptr[ column[ l++ ] ];
					}
					return ( ptr == null ) ? "" : ( CELL_QUOTE + ptr.toString().replace(/"/g, '""') + CELL_QUOTE );
				}).join( CELL_SEPARATOR );
			}).join( LINE_SEPARATOR );
		}
	});

})( this.jQuery, this.app, this.joey );

(function( $, app ) {

	var ui = app.ns("ui");

	ui.JsonPretty = ui.AbstractWidget.extend({
		defaults: {
			obj: null
		},
		init: function(parent) {
			this._super();
			this.el = $(this._main_template());
			this.attach(parent);
			this.el.click(this._click_handler);
		},
		
		_click_handler: function(jEv) {
			var t = $(jEv.target).closest(".uiJsonPretty-name").closest("LI");
			if(t.length === 0 || t.parents(".uiJsonPretty-minimised").length > 0) { return; }
			t.toggleClass("uiJsonPretty-minimised");
			jEv.stopPropagation();
		},
		
		_main_template: function() {
			try {
					return { tag: "DIV", cls: "uiJsonPretty", children: this.pretty.parse(this.config.obj) };
			}	catch (error) {
					throw "JsonPretty error: " + error.message;
			}
		},
		
		pretty: { // from https://github.com/RyanAmos/Pretty-JSON/blob/master/pretty_json.js
			"expando" : function(value) {
				return (value && (/array|object/i).test(value.constructor.name)) ? "expando" : "";
			},
			"parse": function (member) {
				return this[(member == null) ? 'null' : member.constructor.name.toLowerCase()](member);
			},
			"null": function (value) {
				return this['value']('null', 'null');
			},
			"array": function (value) {
				var results = [];
				var lastItem = value.length - 1;
				value.forEach(function( v, i ) {
					results.push({ tag: "LI", cls: this.expando(v), children: [ this['parse'](v) ] });
					if( i !== lastItem ) {
						results.push(",");
					}
				}, this);
				return [ "[ ", ((results.length > 0) ? { tag: "UL", cls: "uiJsonPretty-array", children: results } : null), "]" ];
			},
			"object": function (value) {
				var results = [];
				var keys = Object.keys( value );
				var lastItem = keys.length - 1;
				keys.forEach( function( key, i ) {
					var children = [ this['value']( 'name', '"' + key + '"' ), ": ", this['parse']( value[ key ]) ];
					if( i !== lastItem ) {
						children.push(",");
					}
					results.push( { tag: "LI", cls: this.expando( value[ key ] ), children: children } );
				}, this);
				return [ "{ ", ((results.length > 0) ? { tag: "UL", cls: "uiJsonPretty-object", children: results } : null ),  "}" ];
			},
			"number": function (value) {
				return this['value']('number', value.toString());
			},
			"string": function (value) {
				if (/^(http|https|file):\/\/[^\s]+$/.test(value)) {
					return this['link']( value );
				} else {
					return this['value']('string', '"' + value.toString() + '"');
				}
			},
			"boolean": function (value) {
				return this['value']('boolean', value.toString());
			},
			"link": function( value ) {
					return this['value']("string", { tag: "A", href: value, target: "_blank", text: '"' + value + '"' } );
			},
			"value": function (type, value) {
				if (/^(http|https|file):\/\/[^\s]+$/.test(value)) {
				}
				return { tag: "SPAN", cls: "uiJsonPretty-" + type, text: value };
			}
		}
	});

})( this.jQuery, this.app );

(function( $, app ) {

	var ui = app.ns("ui");
	var ut = app.ns("ut");

	ui.PanelForm = ui.AbstractWidget.extend({
		defaults: {
			fields: null	// (required) instanceof app.ux.FieldCollection
		},
		init: function(parent) {
			this._super();
			this.el = $.joey(this._main_template());
			this.attach( parent );
		},
		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "uiPanelForm", children: this.config.fields.fields.map(this._field_template, this) };
		},
		_field_template: function(field) {
			return { tag: "LABEL", cls: "uiPanelForm-field", children: [
				{ tag: "DIV", cls: "uiPanelForm-label", children: [ field.label, ut.require_template(field) ] },
				field
			]};
		}
	});

})( this.jQuery, this.app );

(function( app ){

	var ui = app.ns("ui");

	ui.HelpPanel = ui.InfoPanel.extend({
		defaults: {
			ref: "",
			open: true,
			autoRemove: true,
			modal: false,
			width: 500,
			height: 450,
			title: i18n.text("General.Help")
		},
		init: function() {
			this._super();
			this.body.append(i18n.text(this.config.ref));
		}
	});

})( this.app );

(function( app ) {

	var ui = app.ns("ui");

	ui.JsonPanel = ui.InfoPanel.extend({
		defaults: {
			json: null, // (required)
			modal: false,
			open: true,
			autoRemove: true,
			height: 500,
			width: 600
		},

		_baseCls: "uiPanel uiInfoPanel uiJsonPanel",

		_body_template: function() {
			var body = this._super();
			body.children = [ new ui.JsonPretty({ obj: this.config.json }) ];
			return body;
		}
	});

})( this.app );

(function( $, app, i18n ) {

	var ui = app.ns("ui");

	ui.SidebarSection = ui.AbstractWidget.extend({
		defaults: {
			title: "",
			help: null,
			body: null,
			open: false
		},
		init: function() {
			this._super();
			this.el = $.joey( this._main_template() );
			this.body = this.el.children(".uiSidebarSection-body");
			this.config.open && ( this.el.addClass("shown") && this.body.css("display", "block") );
		},
		_showSection_handler: function( ev ) {
			var shown = $( ev.target ).closest(".uiSidebarSection")
				.toggleClass("shown")
					.children(".uiSidebarSection-body").slideToggle(200, function() { this.fire("animComplete", this); }.bind(this))
				.end()
				.hasClass("shown");
			this.fire(shown ? "show" : "hide", this);
		},
		_showHelp_handler: function( ev ) {
			new ui.HelpPanel({ref: this.config.help});
			ev.stopPropagation();
		},
		_main_template: function() { return (
			{ tag: "DIV", cls: "uiSidebarSection", children: [
				(this.config.title && { tag: "DIV", cls: "uiSidebarSection-head", onclick: this._showSection_handler, children: [
					this.config.title,
					( this.config.help && { tag: "SPAN", cls: "uiSidebarSection-help pull-right", onclick: this._showHelp_handler, text: i18n.text("General.HelpGlyph") } )
				] }),
				{ tag: "DIV", cls: "uiSidebarSection-body", children: [ this.config.body ] }
			] }
		); }
	});

})( this.jQuery, this.app, this.i18n );

(function( $, app ) {

	var ui = app.ns("ui");

	ui.ResultTable = ui.Table.extend({
		defaults: {
			width: 500,
			height: 400
		},

		init: function() {
			this._super();
			this.on("rowClick", this._showPreview_handler);
			this.selectedRow = null;
			$(document).bind("keydown", this._nav_handler);
		},
		remove: function() {
			$(document).unbind("keydown", this._nav_handler);
			this._super();
		},
		attach: function(parent) {
			if(parent) {
				var height = parent.height() || ( $(document).height() - parent.offset().top - 41 ); // 41 = height in px of .uiTable-tools + uiTable-header
				var width = parent.width();
				this.el.width( width );
				this.body.width( width ).height( height );
			}
			this._super(parent);
		},
		showPreview: function(row) {
			row.addClass("selected");
			this.preview = new app.ui.JsonPanel({
				title: i18n.text("Browser.ResultSourcePanelTitle"),
				json: row.data("row")._source,
				onClose: function() { row.removeClass("selected"); }
			});
		},
		_nav_handler: function(jEv) {
			if(jEv.keyCode !== 40 && jEv.keyCode !== 38) {
				return;
			}
			this.selectedRow && this.preview && this.preview.remove();
			if(jEv.keyCode === 40) { // up arrow
				this.selectedRow = this.selectedRow ? this.selectedRow.next("TR") : this.body.find("TR:first");
			} else if(jEv.keyCode === 38) { // down arrow
				this.selectedRow = this.selectedRow ? this.selectedRow.prev("TR") : this.body.find("TR:last");
			}
			this.selectedRow && this.showPreview(this.selectedRow);
		},
		_showPreview_handler: function(obj, data) {
			this.showPreview(this.selectedRow = data.row);
		}
	});

})( this.jQuery, this.app );

(function( $, app, i18n ) {

	var ui = app.ns("ui");
	var ut = app.ns("ut");

	ui.QueryFilter = ui.AbstractWidget.extend({
		defaults: {
			metadata: null,   // (required) instanceof app.data.MetaData
			query: null       // (required) instanceof app.data.Query that the filters will act apon
		},
		init: function() {
			this._super();
			this.metadata = this.config.metadata;
			this.query = this.config.query;
			this.el = $(this._main_template());
		},
		helpTypeMap: {
			"date" : "QueryFilter.DateRangeHelp"
		},
		requestUpdate: function(jEv) {
			if(jEv && jEv.originalEvent) { // we only want to update on real user interaction not generated events
				this.query.setPage(1);
				this.query.query();
			}
		},
		getSpec: function(fieldName) {
			return this.metadata.fields[fieldName];
		},
		_selectAlias_handler: function(jEv) {
			var indices = (jEv.target.selectedIndex === 0) ? [] : this.metadata.getIndices($(jEv.target).val());
			$(".uiQueryFilter-index").each(function(i, el) {
				var jEl = $(el);
				if(indices.contains(jEl.text()) !== jEl.hasClass("selected")) {
					jEl.click();
				}
			});
			this.requestUpdate(jEv);
		},
		_selectIndex_handler: function(jEv) {
			var jEl = $(jEv.target).closest(".uiQueryFilter-index");
			jEl.toggleClass("selected");
			var selected = jEl.hasClass("selected");
			this.query.setIndex(jEl.text(), selected);
			if(selected) {
				var types = this.metadata.getTypes(this.query.indices);
				this.el.find("DIV.uiQueryFilter-type.selected").each(function(n, el) {
					if(! types.contains($(el).text())) {
						$(el).click();
					}
				});
			}
			this.requestUpdate(jEv);
		},
		_selectType_handler: function(jEv) {
			var jEl = $(jEv.target).closest(".uiQueryFilter-type");
			jEl.toggleClass("selected");
			var type = jEl.text(), selected = jEl.hasClass("selected");
			this.query.setType(type, selected);
			if(selected) {
				var indices = this.metadata.types[type].indices;
				// es throws a 500 if searching an index for a type it does not contain - so we prevent that
				this.el.find("DIV.uiQueryFilter-index.selected").each(function(n, el) {
					if(! indices.contains($(el).text())) {
						$(el).click();
					}
				});
				// es throws a 500 if you specify types from different indices with _all
				jEl.siblings(".uiQueryFilter-type.selected").forEach(function(el) {
					if(this.metadata.types[$(el).text()].indices.intersection(indices).length === 0) {
						$(el).click();
					}
				}, this);
			}
			this.requestUpdate(jEv);
		},
		_openFilter_handler: function(section) {
			var field_name = section.config.title;
			if(! section.loaded) {
				var spec = this.getSpec(field_name);
				if(spec.core_type === "string") {
					section.body.append(this._textFilter_template(spec));
				} else if(spec.core_type === "date") {
					section.body.append(this._dateFilter_template(spec));
					section.body.append(new ui.DateHistogram({ printEl: section.body.find("INPUT"), cluster: this.cluster, query: this.query, spec: spec }));
				} else if(spec.core_type === "number") {
					section.body.append(this._numericFilter_template(spec));
				} else if(spec.core_type === 'boolean') {
					section.body.append(this._booleanFilter_template(spec));
				} else if (spec.core_type === 'multi_field') {
					section.body.append(this._multiFieldFilter_template(section, spec));
				} 
				section.loaded = true;
			}
			section.on("animComplete", function(section) { section.body.find("INPUT").focus(); });
		},
		_textFilterChange_handler: function(jEv) {
			var jEl = $(jEv.target).closest("INPUT");
			var val = jEl.val();
			var spec = jEl.data("spec");
			var uqids = jEl.data("uqids") || [];
			uqids.forEach(function(uqid) {
				uqid && this.query.removeClause(uqid);
			}, this);
			if(val.length) {
				if(jEl[0] === document.activeElement && jEl[0].selectionStart === jEl[0].selectionEnd) {
					val = val.replace(new RegExp("(.{"+jEl[0].selectionStart+"})"), "$&*");
				}
				uqids = val.split(/\s+/).map(function(term) {
					// Figure out the actual field name - needed for multi_field, because
					// querying for "field.field" will not work. Simply "field" must be used
					// if nothing is aliased.
					var fieldNameParts = spec.field_name.split('.');
					var part = fieldNameParts.length - 1;
					var name = fieldNameParts[part];
					while (part >= 1) {
						if (fieldNameParts[part] !== fieldNameParts[part - 1]) {
							name = fieldNameParts[part - 1] + "." + name;
						}
						part--;
					}
					return term && this.query.addClause(term, name, "wildcard", "must");
				}, this);
			}
			jEl.data("uqids", uqids);
			this.requestUpdate(jEv);
		},
		_dateFilterChange_handler: function(jEv) {
			var jEl = $(jEv.target).closest("INPUT");
			var val = jEl.val();
			var spec = jEl.data("spec");
			var uqid = jEl.data("uqid") || null;
			var range = window.dateRangeParser.parse(val);
			var lastRange = jEl.data("lastRange");
			if(!range || (lastRange && lastRange.start === range.start && lastRange.end === range.end)) {
				return;
			}
			uqid && this.query.removeClause(uqid);
			if((range.start && range.end) === null) {
				uqid = null;
			} else {
				var value = {};
				if( range.start ) {
					value["gte"] = range.start;
				}
				if( range.end ) {
					value["lte"] = range.end;
				}
				uqid = this.query.addClause( value, spec.field_name, "range", "must");
			}
			jEl.data("lastRange", range);
			jEl.siblings(".uiQueryFilter-rangeHintFrom")
				.text(i18n.text("QueryFilter.DateRangeHint.from", range.start && new Date(range.start).toUTCString()));
			jEl.siblings(".uiQueryFilter-rangeHintTo")
				.text(i18n.text("QueryFilter.DateRangeHint.to", range.end && new Date(range.end).toUTCString()));
			jEl.data("uqid", uqid);
			this.requestUpdate(jEv);
		},
		_numericFilterChange_handler: function(jEv) {
			var jEl = $(jEv.target).closest("INPUT");
			var val = jEl.val();
			var spec = jEl.data("spec");
			var uqid = jEl.data("uqid") || null;
			var lastRange = jEl.data("lastRange");
			var range = (function(val) {
				var ops = val.split(/->|<>|</).map( function(v) { return parseInt(v.trim(), 10); });
				if(/<>/.test(val)) {
					return { gte: (ops[0] - ops[1]), lte: (ops[0] + ops[1]) };
				} else if(/->|</.test(val)) {
					return { gte: ops[0], lte: ops[1] };
				} else {
					return { gte: ops[0], lte: ops[0] };
				}
			})(val || "");
			if(!range || (lastRange && lastRange.lte === range.lte && lastRange.gte === range.gte)) {
				return;
			}
			jEl.data("lastRange", range);
			uqid && this.query.removeClause(uqid);
			uqid = this.query.addClause( range, spec.field_name, "range", "must");
			jEl.data("uqid", uqid);
			this.requestUpdate(jEv);
		},
		_booleanFilterChange_handler: function( jEv ) {
			var jEl = $(jEv.target).closest("SELECT");
			var val = jEl.val();
			var spec = jEl.data("spec");
			var uqid = jEl.data("uqid") || null;
			uqid && this.query.removeClause(uqid);
			if(val === "true" || val === "false") {
				jEl.data("uqid", this.query.addClause(val, spec.field_name, "term", "must") );
			}
			this.requestUpdate(jEv);
		},
		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "uiQueryFilter", children: [
				this._aliasSelector_template(),
				this._indexSelector_template(),
				this._typesSelector_template(),
				this._filters_template()
			] };
		},
		_aliasSelector_template: function() {
			var aliases = Object.keys(this.metadata.aliases).sort();
			aliases.unshift( i18n.text("QueryFilter.AllIndices") );
			return { tag: "DIV", cls: "uiQueryFilter-section uiQueryFilter-aliases", children: [
				{ tag: "SELECT", onChange: this._selectAlias_handler, children: aliases.map(ut.option_template) }
			] };
		},
		_indexSelector_template: function() {
			var indices = Object.keys( this.metadata.indices ).sort();
			return { tag: "DIV", cls: "uiQueryFilter-section uiQueryFilter-indices", children: [
				{ tag: "HEADER", text: i18n.text("QueryFilter-Header-Indices") },
				{ tag: "DIV", onClick: this._selectIndex_handler, children: indices.map( function( name ) {
					return { tag: "DIV", cls: "uiQueryFilter-booble uiQueryFilter-index", text: name };
				})}
			] };
		},
		_typesSelector_template: function() {
			var types = Object.keys( this.metadata.types ).sort();
			return { tag: "DIV", cls: "uiQueryFilter-section uiQueryFilter-types", children: [
				{ tag: "HEADER", text: i18n.text("QueryFilter-Header-Types") },
				{ tag: "DIV", onClick: this._selectType_handler, children: types.map( function( name ) {
					return { tag: "DIV", cls: "uiQueryFilter-booble uiQueryFilter-type", text: name };
				})}
			] };
		},
		_filters_template: function() {
			var _metadataFields = this.metadata.fields;
			var fields = Object.keys( _metadataFields ).sort()
				.filter(function(d) { return (_metadataFields[d].core_type !== undefined); });
			return { tag: "DIV", cls: "uiQueryFilter-section uiQueryFilter-filters", children: [
				{ tag: "HEADER", text: i18n.text("QueryFilter-Header-Fields") },
				{ tag: "DIV", children: fields.map( function(name ) {
					return new app.ui.SidebarSection({
						title: name,
						help: this.helpTypeMap[this.metadata.fields[ name ].type],
						onShow: this._openFilter_handler
					});
				}, this ) }
			] };
		},
		_textFilter_template: function(spec) {
			return { tag: "INPUT", data: { spec: spec }, onKeyup: this._textFilterChange_handler };
		},
		_dateFilter_template: function(spec) {
			return { tag: "DIV", children: [
				{ tag: "INPUT", data: { spec: spec }, onKeyup: this._dateFilterChange_handler },
				{ tag: "PRE", cls: "uiQueryFilter-rangeHintFrom", text: i18n.text("QueryFilter.DateRangeHint.from", "")},
				{ tag: "PRE", cls: "uiQueryFilter-rangeHintTo", text: i18n.text("QueryFilter.DateRangeHint.to", "") }
			]};
		},
		_numericFilter_template: function(spec) {
			return { tag: "INPUT", data: { spec: spec }, onKeyup: this._numericFilterChange_handler };
		},
		_booleanFilter_template: function(spec) {
			return { tag: "SELECT", data: { spec: spec }, onChange: this._booleanFilterChange_handler,
				children: [ i18n.text("QueryFilter.AnyValue"), "true", "false" ].map( function( val ) {
					return { tag: "OPTION", value: val, text: val };
				})
			};
		},
		_multiFieldFilter_template: function(section, spec) {
			return {
				tag : "DIV", cls : "uiQueryFilter-subMultiFields", children : acx.eachMap(spec.fields, function(name, data) {
					if (name === spec.field_name) {
						section.config.title = spec.field_name + "." + name;
						return this._openFilter_handler(section);
					}
					return new app.ui.SidebarSection({
						title : data.field_name, help : this.helpTypeMap[data.type], onShow : this._openFilter_handler
					});
				}, this)
			};
		}	
	});

})( this.jQuery, this.app, this.i18n );

(function( app ) {

	var ui = app.ns("ui");

	ui.Page = ui.AbstractWidget.extend({
		show: function() {
			this.el.show();
		},
		hide: function() {
			this.el.hide();
		}
	});

})( this.app );
(function( $, app, i18n ){

	var ui = app.ns("ui");
	var data = app.ns("data");

	ui.Browser = ui.Page.extend({
		defaults: {
			cluster: null  // (required) instanceof app.services.Cluster
		},
		init: function() {
			this._super();
			this.cluster = this.config.cluster;
			this.query = new app.data.Query( { cluster: this.cluster } );
			this._refreshButton = new ui.Button({
				label: i18n.text("General.RefreshResults"),
				onclick: function( btn ) {
					this.query.query();
				}.bind(this)
			});
			this.el = $(this._main_template());
			new data.MetaDataFactory({
				cluster: this.cluster,
				onReady: function(metadata) {
					this.metadata = metadata;
					this.store = new data.QueryDataSourceInterface( { metadata: metadata, query: this.query } );
					this.queryFilter = new ui.QueryFilter({ metadata: metadata, query: this.query });
					this.queryFilter.attach(this.el.find("> .uiBrowser-filter") );
					this.resultTable = new ui.ResultTable( {
						onHeaderClick: this._changeSort_handler,
						store: this.store
					} );
					this.resultTable.attach( this.el.find("> .uiBrowser-table") );
					this.updateResults();
				}.bind(this)
			});
		},
		updateResults: function() {
			this.query.query();
		},
		_changeSort_handler: function(table, wEv) {
			this.query.setSort(wEv.column, wEv.dir === "desc");
			this.query.setPage(1);
			this.query.query();
		},
		_main_template: function() {
			return { tag: "DIV", cls: "uiBrowser", children: [
				new ui.Toolbar({
					label: i18n.text("Browser.Title"),
					left: [ ],
					right: [ this._refreshButton ]
				}),
				{ tag: "DIV", cls: "uiBrowser-filter" },
				{ tag: "DIV", cls: "uiBrowser-table" }
			] };
		}
	});

})( this.jQuery, this.app, this.i18n );

(function( $, app, i18n, raphael ) {

	var ui = app.ns("ui");
	var ut = app.ns("ut");
	var services = app.ns("services");

	ui.AnyRequest = ui.Page.extend({
		defaults: {
			cluster: null,       // (required) instanceof app.services.Cluster
			path: "_search",     // default uri to send a request to
			query: { query: { match_all: { }}},
			transform: "  return root;" // default transformer function (does nothing)
		},
		init: function(parent) {
			this._super();
			this.prefs = services.Preferences.instance();
			this.history = this.prefs.get("anyRequest-history") || [ { type: "POST", path: this.config.path, query : JSON.stringify(this.config.query), transform: this.config.transform } ];
			this.el = $.joey(this._main_template());
			this.base_uriEl = this.el.find("INPUT[name=base_uri]");
			this.pathEl = this.el.find("INPUT[name=path]");
			this.typeEl = this.el.find("SELECT[name=method]");
			this.dataEl = this.el.find("TEXTAREA[name=body]");
			this.prettyEl = this.el.find("INPUT[name=pretty]");
			this.transformEl = this.el.find("TEXTAREA[name=transform]");
			this.asGraphEl = this.el.find("INPUT[name=asGraph]");
			this.asTableEl = this.el.find("INPUT[name=asTable]");
			this.asJsonEl = this.el.find("INPUT[name=asJson]");
			this.cronEl = this.el.find("SELECT[name=cron]");
			this.outEl = this.el.find("DIV.uiAnyRequest-out");
			this.errEl = this.el.find("DIV.uiAnyRequest-jsonErr");
			this.typeEl.val("GET");
			this.attach(parent);
			this.setHistoryItem(this.history[this.history.length - 1]);
		},
		setHistoryItem: function(item) {
			this.pathEl.val(item.path);
			this.typeEl.val(item.type);
			this.dataEl.val(item.query);
			this.transformEl.val(item.transform);
		},
		_request_handler: function( ev ) {
			if(! this._validateJson_handler()) {
				return;
			}
			var path = this.pathEl.val(),
					type = this.typeEl.val(),
					query = JSON.stringify(JSON.parse(this.dataEl.val())),
					transform = this.transformEl.val(),
					base_uri = this.base_uriEl.val();
			if( ev ) { // if the user click request
				if(this.timer) {
					window.clearTimeout(this.timer); // stop any cron jobs
				}
				delete this.prevData; // remove data from previous cron runs
				this.outEl.text(i18n.text("AnyRequest.Requesting"));
				if( ! /\/$/.test( base_uri )) {
					base_uri += "/";
					this.base_uriEl.val( base_uri );
				}
				for(var i = 0; i < this.history.length; i++) {
					if(this.history[i].path === path &&
						this.history[i].type === type &&
						this.history[i].query === query &&
						this.history[i].transform === transform) {
						this.history.splice(i, 1);
					}
				}
				this.history.push({
					path: path,
					type: type,
					query: query,
					transform: transform
				});
				this.history.slice(250); // make sure history does not get too large
				this.prefs.set( "anyRequest-history", this.history );
				this.el.find("UL.uiAnyRequest-history")
					.empty()
					.append($( { tag: "UL", children: this.history.map(this._historyItem_template, this) }).children())
					.children().find(":last-child").each(function(i, j) { j.scrollIntoView(false); }).end()
					.scrollLeft(0);
			}
			this.config.cluster.request({
				url: base_uri + path,
				type: type,
				data: query,
				success: this._responseWriter_handler,
				error: this._responseError_handler
			});
		},
		_responseError_handler: function (response) {
			var obj;
			try {
				obj = JSON.parse(response.responseText);
				if (obj) {
					this._responseWriter_handler(obj);
				}
			} catch (err) {
			}
		},
		_responseWriter_handler: function(data) {
			this.outEl.empty();
			try {
				data = (new Function("root", "prev", this.transformEl.val()))(data, this.prevData)
			} catch(e) {
				this.errEl.text(e.message);
				return;
			}
			if(this.asGraphEl.attr("checked")) {
				var w = this.outEl.width();
				raphael(this.outEl[0], w - 10, 300)
					.g.barchart(10, 10, w - 20, 280, [data]);
			}
			if(this.asTableEl.attr("checked")) {
				try {
					var store = new app.data.ResultDataSourceInterface();
					this.outEl.append(new app.ui.ResultTable({
						width: this.outEl.width() - 23,
						store: store
					} ) );
					store.results(data);
				} catch(e) {
					this.errEl.text("Results Table Failed: " + e.message);
				}
			}
			if(this.asJsonEl.attr("checked")) {
				this.outEl.append(new ui.JsonPretty({ obj: data }));
			}
			if(this.cronEl.val() > 0) {
				this.timer = window.setTimeout(function(){
					this._request_handler();
				}.bind(this), this.cronEl.val());
			}
			this.prevData = data;
		},
		_validateJson_handler: function( ev ) {
			/* if the textarea is empty, we replace its value by an empty JSON object : "{}" and the request goes on as usual */
			var jsonData = this.dataEl.val().trim();
			var j;
			if(jsonData === "") {
				jsonData = "{}";
				this.dataEl.val( jsonData );
			}
			try {
				j = JSON.parse(jsonData);
			} catch(e) {
				this.errEl.text(e.message);
				return false;
			}
			this.errEl.text("");
			if(this.prettyEl.attr("checked")) {
				this.dataEl.val(JSON.stringify(j, null, "  "));
			}
			return true;
		},
		_historyClick_handler: function( ev ) {
			var item = $( ev.target ).closest( "LI" ).data( "item" );
			this.setHistoryItem( item );
		},
		_main_template: function() {
			return { tag: "DIV", cls: "anyRequest", children: [
				{ tag: "DIV", cls: "uiAnyRequest-request", children: [
					new app.ui.SidebarSection({
						open: false,
						title: i18n.text("AnyRequest.History"),
						body: { tag: "UL", onclick: this._historyClick_handler, cls: "uiAnyRequest-history", children: this.history.map(this._historyItem_template, this)	}
					}),
					new app.ui.SidebarSection({
						open: true,
						title: i18n.text("AnyRequest.Query"),
						body: { tag: "DIV", children: [
							{ tag: "INPUT", type: "text", name: "base_uri", value: this.config.cluster.config.base_uri },
							{ tag: "BR" },
							{ tag: "INPUT", type: "text", name: "path", value: this.config.path },
							{ tag: "SELECT", name: "method", children: ["POST", "GET", "PUT", "HEAD", "DELETE"].map(ut.option_template) },
							{ tag: "TEXTAREA", name: "body", rows: 20, text: JSON.stringify(this.config.query) },
							{ tag: "BUTTON", css: { cssFloat: "right" }, type: "button", children: [ { tag: "B", text: i18n.text("AnyRequest.Request") } ], onclick: this._request_handler },
							{ tag: "BUTTON", type: "button", text: i18n.text("AnyRequest.ValidateJSON"), onclick: this._validateJson_handler },
							{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", name: "pretty" }, i18n.text("AnyRequest.Pretty") ] },
							{ tag: "DIV", cls: "uiAnyRequest-jsonErr" }
						]}
					}),
					new app.ui.SidebarSection({
						title: i18n.text("AnyRequest.Transformer"),
						help: "AnyRequest.TransformerHelp",
						body: { tag: "DIV", children: [
							{ tag: "CODE", text: "function(root, prev) {" },
							{ tag: "BR" },
							{ tag: "TEXTAREA", name: "transform", rows: 5, text: this.config.transform },
							{ tag: "BR" },
							{ tag: "CODE", text: "}" }
						] }
					}),
					new app.ui.SidebarSection({
						title: i18n.text("AnyRequest.RepeatRequest"),
						body: { tag: "DIV", children: [
							i18n.text("AnyRequest.RepeatRequestSelect"), " ",
							{ tag: "SELECT", name: "cron", children: [
								{ value: 0, text: "do not repeat" },
								{ value: 1000, text: "second" },
								{ value: 1000 * 2, text: "2 seconds" },
								{ value: 1000 * 5, text: "5 seconds" },
								{ value: 1000 * 20, text: "20 seconds" },
								{ value: 1000 * 60, text: "minute" },
								{ value: 1000 * 60 * 10, text: "10 minutes" },
								{ value: 1000 * 60 * 60, text: "hour" }
							].map(function(op) { return $.extend({ tag: "OPTION"}, op); }) }
						] }
					}),
					new app.ui.SidebarSection({
						title: i18n.text("AnyRequest.DisplayOptions"),
						help: "AnyRequest.DisplayOptionsHelp",
						body: { tag: "DIV", children: [
							{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", checked: true, name: "asJson" }, i18n.text("AnyRequest.AsJson") ] },
							{ tag: "BR" },
							{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", name: "asGraph" }, i18n.text("AnyRequest.AsGraph") ] },
							{ tag: "BR" },
							{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", name: "asTable" }, i18n.text("AnyRequest.AsTable") ] }
						] }
					})
				] },
				{ tag: "DIV", cls: "uiAnyRequest-out" }
			] };
		},
		_historyItem_template: function(item) {
			return { tag: "LI", cls: "booble", data: { item: item }, children: [
				{ tag: "SPAN", text: item.path },
				" ",
				{ tag: "EM", text: item.query },
				" ",
				{ tag: "SPAN", text: item.transform }
			] };
		}
	});
	
})( this.jQuery, this.app, this.i18n, this.Raphael );

(function( app, i18n, joey ) {

	var ui = app.ns("ui");
	var ut = app.ns("ut");

	ui.NodesView = ui.AbstractWidget.extend({
		defaults: {
			interactive: true,
			aliasRenderer: "list",
			scaleReplicas: 1,
			cluster: null,
			data: null
		},
		init: function() {
			this._super();
			this.interactive = this.config.interactive;
			this.cluster = this.config.cluster;
			this._aliasRenderFunction = {
				"none": this._aliasRender_template_none,
				"list": this._aliasRender_template_list,
				"full": this._aliasRender_template_full
			}[ this.config.aliasRenderer ];
			this._styleSheetEl = joey({ tag: "STYLE", text: ".uiNodesView-nullReplica, .uiNodesView-replica { zoom: " + this.config.scaleReplicas + " }" });
			this.el = $( this._main_template( this.config.data.cluster, this.config.data.indices ) );
		},

		_newAliasAction_handler: function( index ) {
			var fields = new app.ux.FieldCollection({
				fields: [
					new ui.TextField({ label: i18n.text("AliasForm.AliasName"), name: "alias", require: true })
				]
			});
			var dialog = new ui.DialogPanel({
				title: i18n.text("AliasForm.NewAliasForIndexName", index.name),
				body: new ui.PanelForm({ fields: fields }),
				onCommit: function(panel, args) {
					if(fields.validate()) {
						var data = fields.getData();
						var command = {
							"actions" : [
								{ "add" : { "index" : index.name, "alias" : data["alias"] } }
							]
						};
						this.config.cluster.post('_aliases', JSON.stringify(command), function(d) {
							dialog.close();
							alert(JSON.stringify(d));
							this.fire("redraw");
						}.bind(this) );
					}
				}.bind(this)
			}).open();
		},
		_postIndexAction_handler: function(action, index, redraw) {
			this.cluster.post(index.name + "/" + action, null, function(r) {
				alert(JSON.stringify(r));
				redraw && this.fire("redraw");
			}.bind(this));
		},
		_optimizeIndex_handler: function(index) {
			var fields = new app.ux.FieldCollection({
				fields: [
					new ui.TextField({ label: i18n.text("OptimizeForm.MaxSegments"), name: "max_num_segments", value: "1", require: true }),
					new ui.CheckField({ label: i18n.text("OptimizeForm.ExpungeDeletes"), name: "only_expunge_deletes", value: false }),
					new ui.CheckField({ label: i18n.text("OptimizeForm.FlushAfter"), name: "flush", value: true }),
					new ui.CheckField({ label: i18n.text("OptimizeForm.WaitForMerge"), name: "wait_for_merge", value: false })
				]
			});
			var dialog = new ui.DialogPanel({
				title: i18n.text("OptimizeForm.OptimizeIndex", index.name),
				body: new ui.PanelForm({ fields: fields }),
				onCommit: function( panel, args ) {
					if(fields.validate()) {
						this.cluster.post(index.name + "/_optimize", fields.getData(), function(r) {
							alert(JSON.stringify(r));
						});
						dialog.close();
					}
				}.bind(this)
			}).open();
		},
		_testAnalyser_handler: function(index) {
			this.cluster.get(index.name + "/_analyze?text=" + prompt( i18n.text("IndexCommand.TextToAnalyze") ), function(r) {
				alert(JSON.stringify(r, true, "  "));
			});
		},
		_deleteIndexAction_handler: function(index) {
			if( prompt( i18n.text("AliasForm.DeleteAliasMessage", i18n.text("Command.DELETE"), index.name ) ) === i18n.text("Command.DELETE") ) {
				this.cluster["delete"](index.name, null, function(r) {
					alert(JSON.stringify(r));
					this.fire("redraw");
				}.bind(this) );
			}
		},
		_shutdownNode_handler: function(node) {
			if(prompt( i18n.text("IndexCommand.ShutdownMessage", i18n.text("Command.SHUTDOWN"), node.cluster.name ) ) === i18n.text("Command.SHUTDOWN") ) {
				this.cluster.post( "_cluster/nodes/" + node.name + "/_shutdown", null, function(r) {
					alert(JSON.stringify(r));
					this.fire("redraw");
				}.bind(this));
			}
		},
		_deleteAliasAction_handler: function( index, alias ) {
			if( confirm( i18n.text("Command.DeleteAliasMessage" ) ) ) {
				var command = {
					"actions" : [
						{ "remove" : { "index" : index.name, "alias" : alias.name } }
					]
				};
				this.config.cluster.post('_aliases', JSON.stringify(command), function(d) {
					alert(JSON.stringify(d));
					this.fire("redraw");
				}.bind(this) );
			}
		},

		_replica_template: function(replica) {
			var r = replica.replica;
			return { tag: "DIV",
				cls: "uiNodesView-replica" + (r.primary ? " primary" : "") + ( " state-" + r.state ),
				text: r.shard.toString(),
				onclick: function() { new ui.JsonPanel({
					json: replica.status || r,
					title: r.index + "/" + r.node + " [" + r.shard + "]" });
				}
			};
		},
		_routing_template: function(routing) {
			var cell = { tag: "TD", cls: "uiNodesView-routing" + (routing.open ? "" : " close"), children: [] };
			for(var i = 0; i < routing.replicas.length; i++) {
				if(i % routing.max_number_of_shards === 0 && i > 0) {
					cell.children.push({ tag: "BR" });
				}
				if( routing.replicas[i] ) {
					cell.children.push(this._replica_template(routing.replicas[i]));
				} else {
					cell.children.push( { tag: "DIV", cls: "uiNodesView-nullReplica" } );
				}
			}
			return cell;
		},
		_nodeControls_template: function( node ) { return (
			{ tag: "DIV", cls: "uiNodesView-controls", children: [
				new ui.MenuButton({
					label: i18n.text("NodeInfoMenu.Title"),
					menu: new ui.MenuPanel({
						items: [
							{ text: i18n.text("NodeInfoMenu.ClusterNodeInfo"), onclick: function() { new ui.JsonPanel({ json: node.cluster, title: node.name });} },
							{ text: i18n.text("NodeInfoMenu.NodeStats"), onclick: function() { new ui.JsonPanel({ json: node.stats, title: node.name });} }
						]
					})
				}),
				new ui.MenuButton({
					label: i18n.text("NodeActionsMenu.Title"),
					menu: new ui.MenuPanel({
						items: [
							{ text: i18n.text("NodeActionsMenu.Shutdown"), onclick: function() { this._shutdownNode_handler(node); }.bind(this) }
						]
					})
				})
			] }
		); },
		_nodeIcon_template: function( node ) {
			var icon, alt;
			if( node.name === "Unassigned" ) {
				icon = "fa-exclamation-triangle";
				alt = i18n.text( "NodeType.Unassigned" );
			} else if( node.cluster.settings && "tribe" in node.cluster.settings) {
				icon = "fa-sitemap";
				alt = i18n.text("NodeType.Tribe" );
			} else {
				icon = "fa-" + (node.master_node ? "star" : "circle") + (node.data_node ? "" : "-o" );
				alt = i18n.text( node.master_node ? ( node.data_node ? "NodeType.Master" : "NodeType.Coord" ) : ( node.data_node ? "NodeType.Worker" : "NodeType.Client" ) );
			}
			return { tag: "TD", title: alt, cls: "uiNodesView-icon", children: [
				{ tag: "SPAN", cls: "fa fa-2x " + icon }
			] };
		},
		_node_template: function(node) {
			return { tag: "TR", cls: "uiNodesView-node" + (node.master_node ? " master": ""), children: [
				this._nodeIcon_template( node ),
				{ tag: "TH", children: node.name === "Unassigned" ? [
					{ tag: "H3", text: node.name }
				] : [
					{ tag: "H3", text: node.cluster.name },
					{ tag: "DIV", text: node.cluster.hostname },
					this.interactive ? this._nodeControls_template( node ) : null
				] }
			].concat(node.routings.map(this._routing_template, this))};
		},
		_indexHeaderControls_template: function( index ) { return (
			{ tag: "DIV", cls: "uiNodesView-controls", children: [
				new ui.MenuButton({
					label: i18n.text("IndexInfoMenu.Title"),
					menu: new ui.MenuPanel({
						items: [
							{ text: i18n.text("IndexInfoMenu.Status"), onclick: function() { new ui.JsonPanel({ json: index.status, title: index.name }); } },
							{ text: i18n.text("IndexInfoMenu.Metadata"), onclick: function() { new ui.JsonPanel({ json: index.metadata, title: index.name }); } }
						]
					})
				}),
				new ui.MenuButton({
					label: i18n.text("IndexActionsMenu.Title"),
					menu: new ui.MenuPanel({
						items: [
							{ text: i18n.text("IndexActionsMenu.NewAlias"), onclick: function() { this._newAliasAction_handler(index); }.bind(this) },
							{ text: i18n.text("IndexActionsMenu.Refresh"), onclick: function() { this._postIndexAction_handler("_refresh", index, false); }.bind(this) },
							{ text: i18n.text("IndexActionsMenu.Flush"), onclick: function() { this._postIndexAction_handler("_flush", index, false); }.bind(this) },
							{ text: i18n.text("IndexActionsMenu.Optimize"), onclick: function () { this._optimizeIndex_handler(index); }.bind(this) },
							{ text: i18n.text("IndexActionsMenu.Snapshot"), disabled: closed, onclick: function() { this._postIndexAction_handler("_gateway/snapshot", index, false); }.bind(this) },
							{ text: i18n.text("IndexActionsMenu.Analyser"), onclick: function() { this._testAnalyser_handler(index); }.bind(this) },
							{ text: (index.state === "close") ? i18n.text("IndexActionsMenu.Open") : i18n.text("IndexActionsMenu.Close"), onclick: function() { this._postIndexAction_handler((index.state === "close") ? "_open" : "_close", index, true); }.bind(this) },
							{ text: i18n.text("IndexActionsMenu.Delete"), onclick: function() { this._deleteIndexAction_handler(index); }.bind(this) }
						]
					})
				})
			] }
		); },
		_indexHeader_template: function( index ) {
			var closed = index.state === "close";
			var line1 = closed ? "index: close" : ( "size: " + (index.status && index.status.primaries && index.status.total ? ut.byteSize_template( index.status.primaries.store.size_in_bytes ) + " (" + ut.byteSize_template( index.status.total.store.size_in_bytes ) + ")" : "unknown" ) );
			var line2 = closed ? "\u00A0" : ( "docs: " + (index.status && index.status.primaries && index.status.primaries.docs && index.status.total && index.status.total.docs ? index.status.primaries.docs.count.toLocaleString() + " (" + (index.status.total.docs.count + index.status.total.docs.deleted).toLocaleString() + ")" : "unknown" ) );
			return index.name ? { tag: "TH", cls: (closed ? "close" : ""), children: [
				{ tag: "H3", text: index.name },
				{ tag: "DIV", text: line1 },
				{ tag: "DIV", text: line2 },
				this.interactive ? this._indexHeaderControls_template( index ) : null
			] } : [ { tag: "TD" }, { tag: "TH" } ];
		},
		_aliasRender_template_none: function( cluster, indices ) {
			return null;
		},
		_aliasRender_template_list: function( cluster, indices ) {
			return cluster.aliases.length && { tag: "TBODY", children: [
				{ tag: "TR", children: [
					{ tag: "TD" }
				].concat( indices.map( function( index ) {
					return { tag: "TD", children: index.metadata && index.metadata.aliases.map( function( alias ) {
						return { tag: "LI", text: alias };
					} ) };
				})) }
			] };
		},
		_aliasRender_template_full: function( cluster, indices ) {
			return cluster.aliases.length && { tag: "TBODY", children: cluster.aliases.map( function(alias, row) {
				return { tag: "TR", children: [ { tag: "TD" },{ tag: "TD" } ].concat(alias.indices.map(function(index, i) {
					if (index) {
						return {
							tag: "TD",
							css: { background: "#" + "9ce9c7fc9".substr((row+6)%7,3) },
							cls: "uiNodesView-hasAlias" + ( alias.min === i ? " min" : "" ) + ( alias.max === i ? " max" : "" ),
							text: alias.name,
							children: this.interactive ? [
								{	tag: 'SPAN',
									text: i18n.text("General.CloseGlyph"),
									cls: 'uiNodesView-hasAlias-remove',
									onclick: this._deleteAliasAction_handler.bind( this, index, alias )
								}
							]: null
						};
					}	else {
						return { tag: "TD" };
					}
				}, this ) ) };
			}, this )	};
		},
		_main_template: function(cluster, indices) {
			return { tag: "TABLE", cls: "table uiNodesView", children: [
				this._styleSheetEl,
				{ tag: "THEAD", children: [ { tag: "TR", children: indices.map(this._indexHeader_template, this) } ] },
				this._aliasRenderFunction( cluster, indices ),
				{ tag: "TBODY", children: cluster.nodes.map(this._node_template, this) }
			] };
		}

	});

})( this.app, this.i18n, this.joey );

(function( $, app, i18n ) {

	var ui = app.ns("ui");
	var services = app.ns("services");

	// ( master ) master = true, data = true 
	// ( coordinator ) master = true, data = false
	// ( worker ) master = false, data = true;
	// ( client ) master = false, data = false;
	// http enabled ?

	function nodeSort_name(a, b) {
		if (!(a.cluster && b.cluster)) {
			return 0;
		}
		return a.cluster.name.toString().localeCompare( b.cluster.name.toString() );
	}

	function nodeSort_addr( a, b ) {
		if (!(a.cluster && b.cluster)) {
			return 0;
		}
		return a.cluster.transport_address.toString().localeCompare( b.cluster.transport_address.toString() );
	}

	function nodeSort_type( a, b ) {
		if (!(a.cluster && b.cluster)) {
			return 0;
		}
		if( a.master_node ) {
			return -1;
		} else if( b.master_node ) {
			return 1;
		} else if( a.data_node && !b.data_node ) {
			return -1;
		} else if( b.data_node && !a.data_node ) {
			return 1;
		} else {
			return a.cluster.name.toString().localeCompare( b.cluster.name.toString() );
		}
	}

	var NODE_SORT_TYPES = {
		"Sort.ByName": nodeSort_name,
		"Sort.ByAddress": nodeSort_addr,
		"Sort.ByType": nodeSort_type
	};

	function nodeFilter_none( a ) {
		return true;
	}

	function nodeFilter_clients( a ) {
		return (a.master_node || a.data_node );
	}


	ui.ClusterOverview = ui.Page.extend({
		defaults: {
			cluster: null // (reqired) an instanceof app.services.Cluster
		},
		init: function() {
			this._super();
			this.cluster = this.config.cluster;
			this.prefs = services.Preferences.instance();
			this._clusterState = this.config.clusterState;
			this._clusterState.on("data", this.draw_handler );
			this._refreshButton = new ui.RefreshButton({
				onRefresh: this.refresh.bind(this),
				onChange: function( btn ) {
					if( btn.value === -1 ) {
						this.draw_handler();
					}
				}.bind( this )
			});
			var nodeSortPref = this.prefs.get("clusterOverview-nodeSort") || Object.keys(NODE_SORT_TYPES)[0];
			this._nodeSort = NODE_SORT_TYPES[ nodeSortPref ];
			this._nodeSortMenu = new ui.MenuButton({
				label: i18n.text( "Preference.SortCluster" ),
				menu: new ui.SelectMenuPanel({
					value: nodeSortPref,
					items: Object.keys( NODE_SORT_TYPES ).map( function( k ) {
						return { text: i18n.text( k ), value: k };
					}),
					onSelect: function( panel, event ) {
						this._nodeSort = NODE_SORT_TYPES[ event.value ];
						this.prefs.set("clusterOverview-nodeSort", event.value );
						this.draw_handler();
					}.bind(this)
				})
			});
			this._aliasRenderer = this.prefs.get( "clusterOverview-aliasRender" ) || "full";
			this._aliasMenu = new ui.MenuButton({
				label: i18n.text( "Preference.ViewAliases" ),
				menu: new ui.SelectMenuPanel({
					value: this._aliasRenderer,
					items: [
						{ value: "full", text: i18n.text( "ViewAliases.Grouped" ) },
						{ value: "list", text: i18n.text( "ViewAliases.List" ) },
						{ value: "none", text: i18n.text( "ViewAliases.None" ) } ],
					onSelect: function( panel, event ) {
						this._aliasRenderer = event.value;
						this.prefs.set( "clusterOverview-aliasRender", this._aliasRenderer );
						this.draw_handler();
					}.bind(this)
				})
			});
			this._indexFilter = new ui.TextField({
				value: this.prefs.get("clusterOverview-indexFilter"),
				placeholder: i18n.text( "Overview.IndexFilter" ),
				onchange: function( indexFilter ) {
					this.prefs.set("clusterOverview-indexFilter", indexFilter.val() );
					this.draw_handler();
				}.bind(this)
			});
			this.el = $(this._main_template());
			this.tablEl = this.el.find(".uiClusterOverview-table");
			this.refresh();
		},
		remove: function() {
			this._clusterState.removeObserver( "data", this.draw_handler );
		},
		refresh: function() {
			this._refreshButton.disable();
			this._clusterState.refresh();
		},
		draw_handler: function() {
			var data = this._clusterState;
			var indexFilter;
			try {
				var indexFilterRe = new RegExp( this._indexFilter.val() );
				indexFilter = function(s) { return indexFilterRe.test(s); };
			} catch(e) {
				indexFilter = function() { return true; };
			}
			var clusterState = data.clusterState;
			var status = data.status;
			var nodeStats = data.nodeStats;
			var clusterNodes = data.clusterNodes;
			var nodes = [];
			var indices = [];
			var cluster = {};
			var nodeIndices = {};
			var indexIndices = {}, indexIndicesIndex = 0;
			function newNode(n) {
				return {
					name: n,
					routings: [],
					master_node: clusterState.master_node === n
				};
			}
			function newIndex(i) {
				return {
					name: i,
					replicas: []
				};
			}
			function getIndexForNode(n) {
				return nodeIndices[n] = (n in nodeIndices) ? nodeIndices[n] : nodes.push(newNode(n)) - 1;
			}
			function getIndexForIndex(routings, i) {
				var index = indexIndices[i] = (i in indexIndices) ?
						(routings[indexIndices[i]] = routings[indexIndices[i]] || newIndex(i)) && indexIndices[i]
						: ( ( routings[indexIndicesIndex] = newIndex(i) )  && indexIndicesIndex++ );
				indices[index] = i;
				return index;
			}
			$.each(clusterNodes.nodes, function(name, node) {
				getIndexForNode(name);
			});

			var indexNames = [];
			$.each(clusterState.routing_table.indices, function(name, index){
				indexNames.push(name);
			});
			indexNames.sort().filter( indexFilter ).forEach(function(name) {
				var indexObject = clusterState.routing_table.indices[name];
				$.each(indexObject.shards, function(name, shard) {
					shard.forEach(function(replica){
						var node = replica.node;
						if(node === null) { node = "Unassigned"; }
						var index = replica.index;
						var shard = replica.shard;
						var routings = nodes[getIndexForNode(node)].routings;
						var indexIndex = getIndexForIndex(routings, index);
						var replicas = routings[indexIndex].replicas;
						if(node === "Unassigned" || !indexObject.shards[shard]) {
							replicas.push({ replica: replica });
						} else {
							replicas[shard] = {
								replica: replica,
								status: indexObject.shards[shard].filter(function(replica) {
									return replica.node === node;
								})[0]
							};
						}
					});
				});
			});
			indices = indices.map(function(index){
				return {
					name: index,
					state: "open",
					metadata: clusterState.metadata.indices[index],
					status: status.indices[index]
				};
			}, this);
			$.each(clusterState.metadata.indices, function(name, index) {
				if(index.state === "close" && indexFilter( name )) {
					indices.push({
						name: name,
						state: "close",
						metadata: index,
						status: null
					});
				}
			});
			nodes.forEach(function(node) {
				node.stats = nodeStats.nodes[node.name];
				var cluster = clusterNodes.nodes[node.name];
				node.cluster = cluster || { name: "<unknown>" };
				node.data_node = !( cluster && cluster.attributes && cluster.attributes.data === "false" );
				for(var i = 0; i < indices.length; i++) {
					node.routings[i] = node.routings[i] || { name: indices[i].name, replicas: [] };
					node.routings[i].max_number_of_shards = indices[i].metadata.settings["index.number_of_shards"];
					node.routings[i].open = indices[i].state === "open";
				}
			});
			var aliasesIndex = {};
			var aliases = [];
			var indexClone = indices.map(function() { return false; });
			$.each(clusterState.metadata.indices, function(name, index) {
				index.aliases.forEach(function(alias) {
					var aliasIndex = aliasesIndex[alias] = (alias in aliasesIndex) ? aliasesIndex[alias] : aliases.push( { name: alias, max: -1, min: 999, indices: [].concat(indexClone) }) - 1;
					var indexIndex = indexIndices[name];
					var aliasRow = aliases[aliasIndex];
					aliasRow.min = Math.min(aliasRow.min, indexIndex);
					aliasRow.max = Math.max(aliasRow.max, indexIndex);
					aliasRow.indices[indexIndex] = indices[indexIndex];
				});
			});
			cluster.aliases = aliases;
			cluster.nodes = nodes
				.filter( nodeFilter_none )
				.sort( this._nodeSort );
			indices.unshift({ name: null });
			this._drawNodesView( cluster, indices );
			this._refreshButton.enable();
		},
		_drawNodesView: function( cluster, indices ) {
			this._nodesView && this._nodesView.remove();
			this._nodesView = new ui.NodesView({
				onRedraw: function() {
					this.refresh();
				}.bind(this),
				interactive: ( this._refreshButton.value === -1 ),
				aliasRenderer: this._aliasRenderer,
				cluster: this.cluster,
				data: {
					cluster: cluster,
					indices: indices
				}
			});
			this._nodesView.attach( this.tablEl );
		},
		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "uiClusterOverview", children: [
				new ui.Toolbar({
					label: i18n.text("Overview.PageTitle"),
					left: [
						this._nodeSortMenu,
						this._aliasMenu,
						this._indexFilter
					],
					right: [
						this._refreshButton
					]
				}),
				{ tag: "DIV", cls: "uiClusterOverview-table" }
			] };
		}
	});

})( this.jQuery, this.app, this.i18n );

(function( app, i18n, raphael ) {

	var ui = app.ns("ui");

	ui.DateHistogram = ui.AbstractWidget.extend({
		defaults: {
			printEl: null, // (optional) if supplied, clicking on elements in the histogram changes the query
			cluster: null, // (required)
			query: null,   // (required) the current query
			spec: null     // (required) // date field spec
		},
		init: function() {
			this._super();
			this.el = $(this._main_template());
			this.query = this.config.query.clone();
			// check if the index/types have changed and rebuild the histogram
			this.config.query.on("results", function(query) {
				if(this.queryChanged) {
					this.buildHistogram(query);
					this.queryChanged = false;
				}
			}.bind(this));
			this.config.query.on("setIndex", function(query, params) {
				this.query.setIndex(params.index, params.add);
				this.queryChanged = true;
			}.bind(this));
			this.config.query.on("setType", function(query, params) {
				this.query.setType(params.type, params.add);
				this.queryChanged = true;
			}.bind(this));
			this.query.search.size = 0;
			this.query.on("results", this._stat_handler);
			this.query.on("results", this._aggs_handler);
			this.buildHistogram();
		},
		buildHistogram: function(query) {
			this.statAggs = this.query.addAggs({
				stats: { field: this.config.spec.field_name }
			});
			this.query.query();
			this.query.removeAggs(this.statAggs);
		},
		_stat_handler: function(query, results) {
			if(! results.aggregations[this.statAggs]) { return; }
			this.stats = results.aggregations[this.statAggs];
			// here we are calculating the approximate range  that will give us less than 121 columns
			var rangeNames = [ "year", "year", "month", "day", "hour", "minute" ];
			var rangeFactors = [100000, 12, 30, 24, 60, 60000 ];
			this.intervalRange = 1;
			var range = this.stats.max - this.stats.min;
			do {
				this.intervalName = rangeNames.pop();
				var factor = rangeFactors.pop();
				this.intervalRange *= factor;
				range = range / factor;
			} while(range > 70);
			this.dateAggs = this.query.addAggs({
				date_histogram : {
					field: this.config.spec.field_name,
					interval: this.intervalName
				}
			});
			this.query.query();
			this.query.removeAggs(this.dateAggs);
		},
		_aggs_handler: function(query, results) {
			if(! results.aggregations[this.dateAggs]) { return; }
			var buckets = [], range = this.intervalRange;
			var min = Math.floor(this.stats.min / range) * range;
			var prec = [ "year", "month", "day", "hour", "minute", "second" ].indexOf(this.intervalName);
			results.aggregations[this.dateAggs].buckets.forEach(function(entry) {
				buckets[parseInt((entry.key - min) / range , 10)] = entry.doc_count;
			}, this);
			for(var i = 0; i < buckets.length; i++) {
				buckets[i] = buckets[i] || 0;
			}
			this.el.removeClass("loading");
			var el = this.el.empty();
			var w = el.width(), h = el.height();
			var r = raphael(el[0], w, h );
			var printEl = this.config.printEl;
			query = this.config.query;
			r.g.barchart(0, 0, w, h, [buckets], { gutter: "0", vgutter: 0 }).hover(
				function() {
					this.flag = r.g.popup(this.bar.x, h - 5, this.value || "0").insertBefore(this);
				}, function() {
					this.flag.animate({opacity: 0}, 200, ">", function () {this.remove();});
				}
			).click(function() {
				if(printEl) {
					printEl.val(window.dateRangeParser.print(min + this.bar.index * range, prec));
					printEl.trigger("keyup");
					query.query();
				}
			});
		},
		_main_template: function() { return (
			{ tag: "DIV", cls: "uiDateHistogram loading", css: { height: "50px" }, children: [
				i18n.text("General.LoadingAggs")
			] }
		); }
	});

})( this.app, this.i18n, this.Raphael );
(function( $, app, i18n ) {

	var ui = app.ns("ui");
	var services = app.ns("services");

	ui.ClusterConnect = ui.AbstractWidget.extend({
		defaults: {
			cluster: null
		},
		init: function() {
			this._super();
			this.prefs = services.Preferences.instance();
			this.cluster = this.config.cluster;
			this.el = $.joey(this._main_template());
			this.cluster.get( "", this._node_handler );
		},
		
		_node_handler: function(data) {
			if(data) {
				this.prefs.set("app-base_uri", this.cluster.base_uri);
			}
		},
		
		_reconnect_handler: function() {
			var base_uri = this.el.find(".uiClusterConnect-uri").val();
			$("body").empty().append(new app.App("body", { id: "es", base_uri: base_uri }));
		},
		
		_main_template: function() {
			return { tag: "SPAN", cls: "uiClusterConnect", children: [
				{ tag: "INPUT", type: "text", cls: "uiClusterConnect-uri", onkeyup: function( ev ) {
					if(ev.which === 13) {
						ev.preventDefault();
						this._reconnect_handler();
					}
				}.bind(this), id: this.id("baseUri"), value: this.cluster.base_uri },
				{ tag: "BUTTON", type: "button", text: i18n.text("Header.Connect"), onclick: this._reconnect_handler }
			]};
		}
	});

})( this.jQuery, this.app, this.i18n );


(function( $, app, i18n ) {

	var ui = app.ns("ui");
	var data = app.ns("data");

	var StructuredQuery = ui.AbstractWidget.extend({
		defaults: {
			cluster: null  // (required) instanceof app.services.Cluster
		},
		_baseCls: "uiStructuredQuery",
		init: function(parent) {
			this._super();
			this.selector = new ui.IndexSelector({
				onIndexChanged: this._indexChanged_handler,
				cluster: this.config.cluster
			});
			this.el = $(this._main_template());
			this.out = this.el.find("DIV.uiStructuredQuery-out");
			this.attach( parent );
		},
		
		_indexChanged_handler: function( index ) {
			this.filter && this.filter.remove();
			this.filter = new ui.FilterBrowser({
				cluster: this.config.cluster,
				index: index,
				onStartingSearch: function() { this.el.find("DIV.uiStructuredQuery-out").text( i18n.text("General.Searching") ); this.el.find("DIV.uiStructuredQuery-src").hide(); }.bind(this),
				onSearchSource: this._searchSource_handler,
				onResults: this._results_handler
			});
			this.el.find(".uiStructuredQuery-body").append(this.filter);
		},
		
		_results_handler: function( filter, event ) {
			var typeMap = {
				"json": this._jsonResults_handler,
				"table": this._tableResults_handler,
				"csv": this._csvResults_handler
			};
			typeMap[ event.type ].call( this, event.data, event.metadata );
		},
		_jsonResults_handler: function( results ) {
			this.el.find("DIV.uiStructuredQuery-out").empty().append( new ui.JsonPretty({ obj: results }));
		},
		_csvResults_handler: function( results ) {
			this.el.find("DIV.uiStructuredQuery-out").empty().append( new ui.CSVTable({ results: results }));
		},
		_tableResults_handler: function( results, metadata ) {
			// hack up a QueryDataSourceInterface so that StructuredQuery keeps working without using a Query object
			var qdi = new data.QueryDataSourceInterface({ metadata: metadata, query: new data.Query() });
			var tab = new ui.Table( {
				store: qdi,
				height: 400,
				width: this.out.innerWidth()
			} ).attach(this.out.empty());
			qdi._results_handler(qdi.config.query, results);
		},
		
		_showRawJSON : function() {
			if($("#rawJsonText").length === 0) {
				var hiddenButton = $("#showRawJSON");
				var jsonText = $({tag: "P", type: "p", id: "rawJsonText"});
				jsonText.text(hiddenButton[0].value);
				hiddenButton.parent().append(jsonText);
			}
		},
		
		_searchSource_handler: function(src) {
			var searchSourceDiv = this.el.find("DIV.uiStructuredQuery-src");
			searchSourceDiv.empty().append(new app.ui.JsonPretty({ obj: src }));
			if(typeof JSON !== "undefined") {
				var showRawJSON = $({ tag: "BUTTON", type: "button", text: i18n.text("StructuredQuery.ShowRawJson"), id: "showRawJSON", value: JSON.stringify(src), onclick: this._showRawJSON });
				searchSourceDiv.append(showRawJSON);
			}
			searchSourceDiv.show();
		},
		
		_main_template: function() {
			return { tag: "DIV", cls: this._baseCls, children: [
				this.selector,
				{ tag: "DIV", cls: "uiStructuredQuery-body" },
				{ tag: "DIV", cls: "uiStructuredQuery-src", css: { display: "none" } },
				{ tag: "DIV", cls: "uiStructuredQuery-out" }
			]};
		}
	});

	ui.StructuredQuery = ui.Page.extend({
		init: function() {
			this.q = new StructuredQuery( this.config );
			this.el = this.q.el;
		}
	});

})( this.jQuery, this.app, this.i18n );

(function( $, app, i18n ) {

	var ui = app.ns("ui");
	var data = app.ns("data");
	var ut = app.ns("ut");

	ui.FilterBrowser = ui.AbstractWidget.extend({
		defaults: {
			cluster: null,  // (required) instanceof app.services.Cluster
			index: "" // (required) name of the index to query
		},

		init: function(parent) {
			this._super();
			this._cluster = this.config.cluster;
			this.el = $(this._main_template());
			this.filtersEl = this.el.find(".uiFilterBrowser-filters");
			this.attach( parent );
			new data.MetaDataFactory({ cluster: this._cluster, onReady: function(metadata, eventData) {
				this.metadata = metadata;
				this._createFilters_handler(eventData.originalData.metadata.indices);
			}.bind(this) });
		},

		_createFilters_handler: function(data) {
			var filters = [];
			function scan_properties(path, obj) {
				if (obj.properties) {
					for (var prop in obj.properties) {
						scan_properties(path.concat(prop), obj.properties[prop]);
					}
				} else {
					// handle multi_field 
					if (obj.fields) {
						for (var subField in obj.fields) {
							filters.push({ path: (path[path.length - 1] !== subField) ? path.concat(subField) : path, type: obj.fields[subField].type, meta: obj.fields[subField] });
						}
					} else {
						filters.push({ path: path, type: obj.type, meta: obj });
					}
				}
			}
			for(var type in data[this.config.index].mappings) {
				scan_properties([type], data[this.config.index].mappings[type]);
			}

			filters.sort( function(a, b) {
				var x = a.path.join(".");
				var y = b.path.join(".");
				return (x < y) ? -1 : (x > y) ? 1 : 0;
			});

			this.filters = [
				{ path: ["match_all"], type: "match_all", meta: {} },
				{ path: ["_all"], type: "_all", meta: {}}
			].concat(filters);

			this._addFilterRow_handler();
		},
		
		_addFilterRow_handler: function() {
			this.filtersEl.append(this._filter_template());
		},
		
		_removeFilterRow_handler: function(jEv) {
			$(jEv.target).closest("DIV.uiFilterBrowser-row").remove();
			if(this.filtersEl.children().length === 0) {
				this._addFilterRow_handler();
			}
		},
		
		_search_handler: function() {
			var search = new data.BoolQuery();
			search.setSize( this.el.find(".uiFilterBrowser-outputSize").val() )
			this.fire("startingSearch");
			this.filtersEl.find(".uiFilterBrowser-row").each(function(i, row) {
				row = $(row);
				var bool = row.find(".bool").val();
				var field = row.find(".field").val();
				var op = row.find(".op").val();
				var value = {};
				if(field === "match_all") {
					op = "match_all";
				} else if(op === "range") {
					var lowqual = row.find(".lowqual").val(),
						highqual = row.find(".highqual").val();
					if(lowqual.length) {
						value[row.find(".lowop").val()] = lowqual;
					}
					if(highqual.length) {
						value[row.find(".highop").val()] = highqual;
					}
				} else if(op === "fuzzy") {
					var qual = row.find(".qual").val(),
						fuzzyqual = row.find(".fuzzyqual").val();
					if(qual.length) {
						value["value"] = qual;
					}
					if(fuzzyqual.length) {
						value[row.find(".fuzzyop").val()] = fuzzyqual;
					}
				} else {
					value = row.find(".qual").val();
				}
				search.addClause(value, field, op, bool);
			});
			if(this.el.find(".uiFilterBrowser-showSrc").attr("checked")) {
				this.fire("searchSource", search.search);
			}
			this._cluster.post( this.config.index + "/_search", search.getData(), this._results_handler );
		},
		
		_results_handler: function( data ) {
			var type = this.el.find(".uiFilterBrowser-outputFormat").val();
			this.fire("results", this, { type: type, data: data, metadata: this.metadata });
		},
		
		_changeQueryField_handler: function(jEv) {
			var select = $(jEv.target);
			var spec = select.children(":selected").data("spec");
			select.siblings().remove(".op,.qual,.range,.fuzzy");
			var ops = [];
			if(spec.type === 'match_all') {
			} else if(spec.type === '_all') {
				ops = ["query_string"];
			} else if(spec.type === 'string') {
				ops = ["term", "wildcard", "prefix", "fuzzy", "range", "query_string", "text", "missing"];
			} else if(spec.type === 'long' || spec.type === 'integer' || spec.type === 'float' ||
					spec.type === 'byte' || spec.type === 'short' || spec.type === 'double') {
				ops = ["term", "range", "fuzzy", "query_string", "missing"];
			} else if(spec.type === 'date') {
				ops = ["term", "range", "fuzzy", "query_string", "missing"];
			} else if(spec.type === 'geo_point') {
				ops = ["missing"];
			} else if(spec.type === 'ip') {
				ops = ["term", "range", "fuzzy", "query_string", "missing"];
			} else if(spec.type === 'boolean') {
				ops = ["term"]
			}
			select.after({ tag: "SELECT", cls: "op", onchange: this._changeQueryOp_handler, children: ops.map(ut.option_template) });
			select.next().change();
		},
		
		_changeQueryOp_handler: function(jEv) {
			var op = $(jEv.target), opv = op.val();
			op.siblings().remove(".qual,.range,.fuzzy");
			if(opv === 'term' || opv === 'wildcard' || opv === 'prefix' || opv === "query_string" || opv === 'text') {
				op.after({ tag: "INPUT", cls: "qual", type: "text" });
			} else if(opv === 'range') {
				op.after(this._range_template());
			} else if(opv === 'fuzzy') {
				op.after(this._fuzzy_template());
			}
		},
		
		_main_template: function() {
			return { tag: "DIV", children: [
				{ tag: "DIV", cls: "uiFilterBrowser-filters" },
				{ tag: "BUTTON", type: "button", text: i18n.text("General.Search"), onclick: this._search_handler },
				{ tag: "LABEL", children:
					i18n.complex("FilterBrowser.OutputType", { tag: "SELECT", cls: "uiFilterBrowser-outputFormat", children: [
						{ text: i18n.text("Output.Table"), value: "table" },
						{ text: i18n.text("Output.JSON"), value: "json" },
						{ text: i18n.text("Output.CSV"), value: "csv" }
					].map(function( o ) { return $.extend({ tag: "OPTION" }, o ); } ) } )
				},
				{ tag: "LABEL", children:
					i18n.complex("FilterBrowser.OutputSize", { tag: "SELECT", cls: "uiFilterBrowser-outputSize",
						children: [ "10", "50", "250", "1000", "5000", "25000" ].map( ut.option_template )
					} )
				},
				{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", cls: "uiFilterBrowser-showSrc" }, i18n.text("Output.ShowSource") ] }
			]};
		},
		
		_filter_template: function() {
			return { tag: "DIV", cls: "uiFilterBrowser-row", children: [
				{ tag: "SELECT", cls: "bool", children: ["must", "must_not", "should"].map(ut.option_template) },
				{ tag: "SELECT", cls: "field", onchange: this._changeQueryField_handler, children: this.filters.map(function(f) {
					return { tag: "OPTION", data: { spec: f }, value: f.path.join("."), text: f.path.join(".") };
				})},
				{ tag: "BUTTON", type: "button", text: "+", onclick: this._addFilterRow_handler },
				{ tag: "BUTTON", type: "button", text: "-", onclick: this._removeFilterRow_handler }
			]};
		},
		
		_range_template: function() {
			return { tag: "SPAN", cls: "range", children: [
				{ tag: "SELECT", cls: "lowop", children: ["gt", "gte"].map(ut.option_template) },
				{ tag: "INPUT", type: "text", cls: "lowqual" },
				{ tag: "SELECT", cls: "highop", children: ["lt", "lte"].map(ut.option_template) },
				{ tag: "INPUT", type: "text", cls: "highqual" }
			]};
		},

		_fuzzy_template: function() {
			return { tag: "SPAN", cls: "fuzzy", children: [
				{ tag: "INPUT", cls: "qual", type: "text" },
				{ tag: "SELECT", cls: "fuzzyop", children: ["max_expansions", "min_similarity"].map(ut.option_template) },
				{ tag: "INPUT", cls: "fuzzyqual", type: "text" }
			]};
		}
	});
	
})( this.jQuery, this.app, this.i18n );

(function( $, app, i18n ) {

	var ui = app.ns("ui");

	ui.IndexSelector = ui.AbstractWidget.extend({
		init: function(parent) {
			this._super();
			this.el = $(this._main_template());
			this.attach( parent );
			this.cluster = this.config.cluster;
			this.update();
		},
		update: function() {
			this.cluster.get( "_stats", this._update_handler );
		},
		
		_update_handler: function(data) {
			var options = [];
			var index_names = Object.keys(data.indices).sort();
			for(var i=0; i < index_names.length; i++) { 
				name = index_names[i];
				options.push(this._option_template(name, data.indices[name])); 
			}
			this.el.find(".uiIndexSelector-select").empty().append(this._select_template(options));
			this._indexChanged_handler();
		},
		
		_main_template: function() {
			return { tag: "DIV", cls: "uiIndexSelector", children: i18n.complex( "IndexSelector.SearchIndexForDocs", { tag: "SPAN", cls: "uiIndexSelector-select" } ) };
		},

		_indexChanged_handler: function() {
			this.fire("indexChanged", this.el.find("SELECT").val());
		},

		_select_template: function(options) {
			return { tag: "SELECT", children: options, onChange: this._indexChanged_handler };
		},
		
		_option_template: function(name, index) {
			return  { tag: "OPTION", value: name, text: i18n.text("IndexSelector.NameWithDocs", name, index.primaries.docs.count ) };
		}
	});

})( this.jQuery, this.app, this.i18n );

(function( $, app, i18n ) {

	var ui = app.ns("ui");

	ui.Header = ui.AbstractWidget.extend({
		defaults: {
			cluster: null,
			clusterState: null
		},
		_baseCls: "uiHeader",
		init: function() {
			this._clusterConnect = new ui.ClusterConnect({
				cluster: this.config.cluster
			});
			var quicks = [
				{ text: i18n.text("Nav.Info"), path: "" },
				{ text: i18n.text("Nav.Status"), path: "_stats" },
				{ text: i18n.text("Nav.NodeStats"), path: "_nodes/stats" },
				{ text: i18n.text("Nav.ClusterNodes"), path: "_nodes" },
				{ text: i18n.text("Nav.Plugins"), path: "_nodes/plugins" },
				{ text: i18n.text("Nav.ClusterState"), path: "_cluster/state" },
				{ text: i18n.text("Nav.ClusterHealth"), path: "_cluster/health" },
				{ text: i18n.text("Nav.Templates"), path: "_template" }
			];
			var cluster = this.config.cluster;
			var quickPanels = {};
			var menuItems = quicks.map( function( item ) {
				return { text: item.text, onclick: function() {
					cluster.get( item.path, function( data ) {
						quickPanels[ item.path ] && quickPanels[ item.path ].el && quickPanels[ item.path ].remove();
						quickPanels[ item.path ] = new ui.JsonPanel({
							title: item.text,
							json: data
						});
					} );
				} };
			}, this );
			this._quickMenu = new ui.MenuButton({
				label: i18n.text("NodeInfoMenu.Title"),
				menu: new ui.MenuPanel({
					items: menuItems
				})
			});
			this.el = $.joey( this._main_template() );
			this.nameEl = this.el.find(".uiHeader-name");
			this.statEl = this.el.find(".uiHeader-status");
			this._clusterState = this.config.clusterState;
			this._clusterState.on("data", function( state ) {
				var shards = state.status._shards;
				var colour = state.clusterHealth.status;
				var name = state.clusterState.cluster_name;
				this.nameEl.text( name );
				this.statEl
					.text( i18n.text("Header.ClusterHealth", colour, shards.successful, shards.total ) )
					.css( "background", colour );
			}.bind(this));
			this.statEl.text( i18n.text("Header.ClusterNotConnected") ).css("background", "grey");
			this._clusterState.refresh();
		},
		_main_template: function() { return (
			{ tag: "DIV", cls: this._baseCls, children: [
				this._clusterConnect,
				{ tag: "SPAN", cls: "uiHeader-name" },
				{ tag: "SPAN", cls: "uiHeader-status" },
				{ tag: "H1", text: i18n.text("General.Elasticsearch") },
				{ tag: "SPAN", cls: "pull-right", children: [
					this._quickMenu
				] }
			] }
		); }
	} );

})( this.jQuery, this.app, this.i18n );

(function( $, app, i18n ) {
	
	var ui = app.ns("ui");
	var ut = app.ns("ut");

	ui.IndexOverview = ui.Page.extend({
		defaults: {
			cluster: null
		},
		init: function() {
			this._super();
			this.cluster = this.config.cluster;
			this._clusterState = this.config.clusterState;
			this._clusterState.on("data", this._refresh_handler );
			this.el = $(this._main_template());
			this._refresh_handler();
		},
		remove: function() {
			this._clusterState.removeObserver( "data", this._refresh_handler );
		},
		_refresh_handler: function() {
			var state = this._clusterState;
			var view = {
				indices: acx.eachMap( state.status.indices, function( name, index ) {
					return {
						name: name,
						state: index
					};
				}).sort( function( a, b ) {
					return a.name < b.name ? -1 : 1;
				})
			};
			this._indexViewEl && this._indexViewEl.remove();
			this._indexViewEl = $( this._indexTable_template( view ) );
			this.el.find(".uiIndexOverview-table").append( this._indexViewEl );
		},
		_newIndex_handler: function() {
			var fields = new app.ux.FieldCollection({
				fields: [
					new ui.TextField({ label: i18n.text("ClusterOverView.IndexName"), name: "_name", require: true }),
					new ui.TextField({
						label: i18n.text("ClusterOverview.NumShards"),
						name: "number_of_shards",
						value: "5",
						require: function( val ) { return parseInt( val, 10 ) >= 1; }
					}),
					new ui.TextField({
						label: i18n.text("ClusterOverview.NumReplicas"),
						name: "number_of_replicas",
						value: "1",
						require: function( val ) { return parseInt( val, 10 ) >= 0; }
					})
				]
			});
			var dialog = new ui.DialogPanel({
				title: i18n.text("ClusterOverview.NewIndex"),
				body: new ui.PanelForm({ fields: fields }),
				onCommit: function(panel, args) {
					if(fields.validate()) {
						var data = fields.getData();
						var name = data["_name"];
						delete data["_name"];
						this.config.cluster.put( name, JSON.stringify({ settings: { index: data } }), function(d) {
							dialog.close();
							alert(JSON.stringify(d));
							this._clusterState.refresh();
						}.bind(this) );
					}
				}.bind(this)
			}).open();
		},
		_indexTable_template: function( view ) { return (
			{ tag: "TABLE", cls: "table", children: [
				{ tag: "THEAD", children: [
					{ tag: "TR", children: [
						{ tag: "TH" },
						{ tag: "TH", children: [
							{ tag: "H3", text: "Size" }
						] },
						{ tag: "TH", children: [
							{ tag: "H3", text: "Docs" }
						] }
					] }
				] },
				{ tag: "TBODY", cls: "striped", children: view.indices.map( this._index_template, this ) }
			] }
		); },

		_index_template: function( index ) { return (
			{ tag: "TR", children: [
				{ tag: "TD", children: [
					{ tag: "H3", text: index.name }
				] },
				{ tag: "TD", text: ut.byteSize_template( index.state.primaries.store.size_in_bytes ) + "/" + ut.byteSize_template( index.state.total.store.size_in_bytes ) },
				{ tag: "TD", text: ut.count_template( index.state.primaries.docs.count ) }
			] }
		); },
		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "uiIndexOverview", children: [
				new ui.Toolbar({
					label: i18n.text("IndexOverview.PageTitle"),
					left: [
						new ui.Button({
							label: i18n.text("ClusterOverview.NewIndex"),
							onclick: this._newIndex_handler
						}),
					]
				}),
				{ tag: "DIV", cls: "uiIndexOverview-table", children: this._indexViewEl }
			] };
		}

	});

})( this.jQuery, this.app, this.i18n );

(function( app, i18n ) {

	var ui = app.ns("ui");
	var services = app.ns("services");

	app.App = ui.AbstractWidget.extend({
		defaults: {
			base_uri: null
		},
		init: function(parent) {
			this._super();
			this.prefs = services.Preferences.instance();
			this.base_uri = this.config.base_uri || this.prefs.get("app-base_uri") || "http://localhost:9200";
			if( this.base_uri.charAt( this.base_uri.length - 1 ) !== "/" ) {
				// XHR request fails if the URL is not ending with a "/"
				this.base_uri += "/";
			}
			if( this.config.auth_user ) {
				var credentials = window.btoa( this.config.auth_user + ":" + this.config.auth_password );
				$.ajaxSetup({
					headers: {
						"Authorization": "Basic " + credentials
					}
				});
			}
			this.cluster = new services.Cluster({ base_uri: this.base_uri });
			this._clusterState = new services.ClusterState({
				cluster: this.cluster
			});

			this._header = new ui.Header({ cluster: this.cluster, clusterState: this._clusterState });
			this.$body = $.joey( this._body_template() );
			this.el = $.joey(this._main_template());
			this.attach( parent );
			this.instances = {};
			this.el.find(".uiApp-headerMenuItem:first").click();
			if( this.config.dashboard ) {
				if( this.config.dashboard === "cluster" ) {
					var page = this.instances["ClusterOverview"];
					page._refreshButton.set( 5000 );
				}
			}
		},

		navigateTo: function( type, config, ev ) {
			if( ev.target.classList.contains( "uiApp-headerNewMenuItem" ) ) {
				this.showNew( type, config, ev );
			} else {
				var ref = type + "0";
				if(! this.instances[ ref ]) {
					this.createPage( type, 0, config );
				}
				this.show( ref, ev );
			}
		},

		createPage: function( type, id, config ) {
			var page = this.instances[ type + id ] = new ui[ type ]( config );
			this.$body.append( page );
			return page;
		},

		show: function( ref, ev ) {
			$( ev.target ).closest("DIV.uiApp-headerMenuItem").addClass("active").siblings().removeClass("active");
			for(var p in this.instances) {
				this.instances[p][ p === ref ? "show" : "hide" ]();
			}
		},

		showNew: function( type, config, jEv ) {
			var ref, page, $tab,
				type_index = 0;

			while ( ! page ) {
				ref = type + ( ++type_index );
				if (! ( ref in this.instances ) ) {
					page = this.createPage( type, type_index, config );
				}
			}

			// Add the tab and its click handlers
			$tab = $.joey({
				tag: "DIV",
				cls: "uiApp-headerMenuItem pull-left",
				text: i18n.text("Nav." + type ) + " " + type_index,
				onclick: function( ev ) { this.show( ref, ev ); }.bind(this),
				children: [
					{ tag: "A", text: " [-]", onclick: function (ev) {
						$tab.remove();
						page.remove();
						delete this.instances[ ref ];
					}.bind(this) }
				]
			});

			$('.uiApp-headerMenu').append( $tab );
			$tab.trigger("click");
		},

		_openAnyRequest_handler: function(ev) { this.navigateTo("AnyRequest", { cluster: this.cluster }, ev ); },
		_openStructuredQuery_handler: function(ev) { this.navigateTo("StructuredQuery", { cluster: this.cluster }, ev ); },
		_openBrowser_handler: function(ev) { this.navigateTo("Browser", { cluster: this.cluster }, ev );  },
		_openClusterOverview_handler: function(ev) { this.navigateTo("ClusterOverview", { cluster: this.cluster, clusterState: this._clusterState }, ev ); },
		_openIndexOverview_handler: function(ev) { this.navigateTo("IndexOverview", { cluster: this.cluster, clusterState: this._clusterState }, ev ); },

		_body_template: function() { return (
			{ tag: "DIV", id: this.id("body"), cls: "uiApp-body" }
		); },

		_main_template: function() {
			return { tag: "DIV", cls: "uiApp", children: [
				{ tag: "DIV", id: this.id("header"), cls: "uiApp-header", children: [
					this._header,
					{ tag: "DIV", cls: "uiApp-headerMenu", children: [
						{ tag: "DIV", cls: "uiApp-headerMenuItem pull-left", text: i18n.text("Nav.Overview"), onclick: this._openClusterOverview_handler },
						{ tag: "DIV", cls: "uiApp-headerMenuItem pull-left", text: i18n.text("Nav.Indices"), onclick: this._openIndexOverview_handler },
						{ tag: "DIV", cls: "uiApp-headerMenuItem pull-left", text: i18n.text("Nav.Browser"), onclick: this._openBrowser_handler },
						{ tag: "DIV", cls: "uiApp-headerMenuItem pull-left", text: i18n.text("Nav.StructuredQuery"), onclick: this._openStructuredQuery_handler, children: [
							{ tag: "A", cls: "uiApp-headerNewMenuItem ", text: ' [+]' }
						] },
						{ tag: "DIV", cls: "uiApp-headerMenuItem pull-left", text: i18n.text("Nav.AnyRequest"), onclick: this._openAnyRequest_handler, children: [
							{ tag: "A", cls: "uiApp-headerNewMenuItem ", text: ' [+]' }
						] },
					]}
				]},
				this.$body
			]};
		}
		
	});

})( this.app, this.i18n );

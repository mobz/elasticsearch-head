(function( app ) {

	var ux = app.ns("ux");

	ux.Observable = acx.Class.extend((function() {
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
			var mloc = acx.vector(jEv.pageX, jEv.pageY);
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
			acx.extend(this.config, opts);
			this.fire('dragStart', jEv);
			this.dragObj = this.dragObj || this.config.dragObj;
			this.dragObjOffset = this.config.dragObjOffset || acx.vector(this.dragObj.offset()).sub(jEv.pageX, jEv.pageY);
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
			this.summary = acx.text("TableResults.Summary", res._shards.successful, res._shards.total, res.hits.total, (res.took / 1000).toFixed(3));
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
				var field_name = mapping.index_name || name;
				var field = paths[ dpath ] = fields[ field_name ] || acx.extend({
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
				this.fire("ready", this.metaData,  { originalData: data }); // TODO originalData needed for legacy es.FilterBrowser
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
				facets: {},
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
			return acx.extend(true, {}, { search: this.search, indices: this.indices, types: this.types });
		},
		restoreState: function(state) {
			state = acx.extend(true, {}, state || this.history[this.history.length - 1]);
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
							alert(acx.text("Query.FailAndUndo"));
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
						alert(acx.text("Query.FailAndUndo"));
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
		addFacet: function(facet) {
			var facetId = "f-" + this.refuid++;
			this.search.facets[facetId] = facet;
			this.refmap[facetId] = { facetId: facetId, facet: facet };
			return facetId;
		},
		removeFacet: function(facetId) {
			delete this.search.facets[facetId];
			delete this.refmap[facetId];
		},
		_setClause: function(value, field, op, bool) {
			var clause = {}, query = {};
			if(op === "match_all") {
			} else if(op === "query_string") {
				query["default_field"] = field;
				query["query"] = value;
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

(function( $, app ) {

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
			return this;
		}
	});

})( this.jQuery, this.app );
(function( $, app ) {

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
			this.el = $(this._main_template());
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

})( this.jQuery, this.app );

(function( app ) {

	var ui = app.ns("ui");

	ui.TextField = ui.AbstractField.extend({
		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "uiField uiTextField", children: [
				{ tag: "INPUT", type: "text", name: this.config.name }
			]};
		}
	});

})( this.app );

(function( $, app ) {

	var ui = app.ns("ui");

	ui.Button = ui.AbstractWidget.extend({
		defaults : {
			label: "",                 // the label text
			disabled: false,           // create a disabled button
			autoDisable: false         // automatically disable the button when clicked
		},

		baseClass: "uiButton",

		init: function(parent) {
			this._super();
			this.el = $(this.button_template())
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
			{ tag: 'BUTTON', type: 'button', id: this.id(), cls: this.baseClass, children: [
				{ tag: 'DIV', cls: 'uiButton-content', child:
					{ tag: 'DIV', cls: 'uiButton-label', text: this.config.label }
				}
			] }
		); }
	});

})( this.jQuery, this.app );

(function( $, app ) {

	var ui = app.ns("ui");

	ui.MenuButton = app.ui.Button.extend({
		defaults: {
			menu: null
		},
		baseClass: "uiButton uiMenuButton",
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
		baseClass: "uiSplitButton",
		init: function( parent ) {
			this._super( parent );
			this.items = this.config.items.map( function( item ) {
				return {
					text: item.label,
					selected: item.selected,
					onclick: function( jEv ) {
						var el = $( jEv.target ).closest("LI");
						el.parent().children().removeClass("selected");
						el.addClass("selected");
						this.fire( "select", this, { value: item.value } );
						this.value = item.value;
					}.bind(this)
				};
			}, this );
			this.value = null;
			this.button = new ui.Button({
				label: this.config.label,
				onclick: function() {
					this.fire("click", this, { value: this.value } );
				}.bind(this)
			});
			this.menuButton = new ui.MenuButton({
				label: "\u00a0",
				menu: new (app.ui.MenuPanel.extend({
					baseClass: "uiSplitMenuPanel uiMenuPanel",
					_getPosition: function( jEv ) {
						var parent = $(jEv.target).closest("BUTTON");
						return parent.vOffset()
							.add(parent.vSize())
							.addX( -this.el.vOuterSize().x )
							.asOffset();
					}
				}))({
					items: this.items
				})
			});
			this.el = $(this._main_template());
		},
		disable: function() {
			this.button.disable();
		},
		enable: function() {
			this.button.enable();
		},
		_main_template: function() {
			return { tag: "DIV", cls: this.baseClass, children: [
				this.button, this.menuButton
			] };
		}
	});

})( this.jQuery, this.app );

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
			this.el = $(this._main_template());
		},
		_main_template: function() {
			return { tag: "DIV", cls: "uiToolbar", children: [
				{ tag: "DIV", cls: "ui-left", children: [
					{ tag: "H2", text: this.config.label }
				].concat(this.config.left) },
				{ tag: "DIV", cls: "ui-right", children: this.config.right }
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
		shared: {  // shared data for all instances of acx.ui.Panel and decendants
			stack: [], // array of all open panels
			modal: $( { tag: "DIV", id: "uiModal", css: { opacity: 0.2, position: "absolute", top: "0px", left: "0px" } } )
		},
		init: function() {
			this._super();
		},
		open: function(jEv) {
			this.el
				.css( { visibility: "hidden" } )
				.appendTo( $(this.config.parent) )
				.css( this._getPosition(jEv) )
				.css( { zIndex: (this.shared.stack.length ? (+this.shared.stack[this.shared.stack.length - 1].el.css("zIndex") + 10) : 100) } )
				.css( { visibility: "visible", display: "block" } );
			this.shared.stack.remove(this);
			this.shared.stack.push(this);
			this._setModal();
			$(document).bind("keyup", this._close_handler);
			this.fire("open", { source: this, event: jEv } );
			return this;
		},
		close: function(jEv) {
			var index = this.shared.stack.indexOf(this);
			if(index !== -1) {
				this.shared.stack.splice(index, 1);
				this.el.css( { left: "-2999px" } ); // move the dialog to the left rather than hiding to prevent ie6 rendering artifacts
				this._setModal();
				this.fire("close", { source: this,  event: jEv } );
				if(this.config.autoRemove) {
					this.remove();
				}
			}
			return this;
		},
		// close the panel and remove it from the dom, destroying it (you can not reuse the panel after calling remove)
		remove: function() {
			this.close();
			this._super();
		},
		// starting at the top of the stack, find the first panel that wants a modal and put it just underneath, otherwise remove the modal
		_setModal: function() {
			function docSize() {
				var de = document.documentElement;
				return acx.browser.msie ? // jquery incorrectly uses offsetHeight/Width for the doc size in IE
					acx.vector(Math.max(de.clientWidth, de.scrollWidth), Math.max(de.clientHeight, de.scrollHeight)) : $(document).vSize();
			}
			for(var stackPtr = this.shared.stack.length - 1; stackPtr >= 0; stackPtr--) {
				if(this.shared.stack[stackPtr].config.modal) {
					this.shared.modal
						.appendTo( document.body )
						.css( { zIndex: this.shared.stack[stackPtr].el.css("zIndex") - 5 } )
						.css( docSize().asSize() );
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
		_close_handler: function(jEv) {
			if(jEv.type === "keyup" && jEv.keyCode !== 27) { return; } // press esc key to close
			$(document).unbind("keyup", this._close_handler);
			this.close(jEv);
		}
	});

})( this.jQuery, this.app );

(function( $, app ) {

	var ui = app.ns("ui");

	ui.DraggablePanel = ui.AbstractPanel.extend({
		defaults: {
	//		title: ""   // (required) text for the panel title
		},
		init: function() {
			this._super();
			this.body = $(this._body_template());
			this.title = $(this._title_template());
			this.el = $( this._main_template() );
			this.el.css( { width: this.config.width } );
			this.dd = new app.ux.DragDrop({
				pickupSelector: this.el.find(".uiPanel-titleBar"),
				dragObj: this.el
			});
			// open the panel if set in configuration
			this.config.open && this.open();
		},

		theme: "",

		setBody: function(body) {
				this.body.empty().append(body);
		},
		_body_template: function() { return { tag: "DIV", cls: "uiPanel-body", css: { height: this.config.height + (this.config.height === 'auto' ? "" : "px" ) }, child: this.config.body }; },
		_title_template: function() { return { tag: "SPAN", cls: "uiPanel-title", text: this.config.title }; },
		_main_template: function() { return (
			{ tag: "DIV", id: this.id(), cls: "uiPanel " + this.theme, children: [
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
		theme: "dark"
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
			return { tag: "DIV", cls: "ui-right", children: [
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
		baseClass: "uiMenuPanel",
		init: function() {
			this._super();
			this.el = $(this._main_template());
		},
		open: function(jEv) {
			this._super(jEv);
			var cx = this; setTimeout(function() { $(document).bind("click", cx._close_handler); }, 50);
		},
		_close_handler: function(jEv) {
			this._super(jEv);
			$(document).unbind("click", this._close_handler);
		},
		_main_template: function() {
			return { tag: "DIV", cls: this.baseClass, children: this.config.items.map(this._menuItem_template, this) };
		},
		_menuItem_template: function(item) {
			var dx = item.disabled ? { onclick: function() {} } : {};
			return { tag: "LI", cls: "uiMenuPanel-item" + (item.disabled ? " disabled" : "") + (item.selected ? " selected" : ""), child: acx.extend({ tag: "DIV", cls: "uiMenuPanel-label" }, item, dx ) };
		},
		_getPosition: function(jEv) {
			var parent = $(jEv.target).closest("BUTTON");
			return parent.vOffset()
				.addY(parent.vSize().y)
				.asOffset();
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
			this.el = $(this._main_template());
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
		_scroll_handler: function(jEv) {
			this.el.find(".uiTable-headers").scrollLeft(this.body.scrollLeft());
		},
		_dataClick_handler: function(jEv) {
			var row = $(jEv.target).closest("TR");
			if(row.length) {
				this.fire("rowClick", this, { row: row } );
			}
		},
		_headerClick_handler: function(jEv) {
			var header = $(jEv.target).closest("TH.uiTable-header-cell");
			if(header.length) {
				this.fire("headerClick", this, { header: header, column: header.data("column"), dir: header.data("dir") });
			}
		},
		_main_template: function() {
			return { tag: "DIV", id: this.id(), css: { width: this.config.width + "px" }, cls: "uiTable", children: [
				{ tag: "DIV", cls: "uiTable-tools" },
				{ tag: "DIV", cls: "uiTable-headers",
					onClick: this._headerClick_handler
				},
				{ tag: "DIV", cls: "uiTable-body",
					onClick: this._dataClick_handler,
					onScroll: this._scroll_handler,
					css: { height: this.config.height + "px", width: this.config.width + "px" }
				}
			] };
		},
		_header_template: function(columns) {
			var ret = { tag: "TABLE", child: this._headerRow_template(columns) };
			ret.child.children.push(this._headerEndCap_template());
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
			return { tag: "TH", cls: "uiTable-headerEndCap", child: { tag: "DIV" } };
		},
		_body_template: function(data, columns) {
			return { tag: "TABLE", children: []
				.concat(this._headerRow_template(columns))
				.concat(data.map(function(row) {
					return { tag: "TR", data: { row: row }, cls: "uiTable-row", children: columns.map(function(column){
						return { tag: "TD", cls: "uiTable-cell", child: { tag: "DIV", text: (row[column] || "").toString() } };
					})};
				}))
			};
		}

	});

})( this.jQuery, this.app );

(function( $, app ) {

	var ui = app.ns("ui");

	ui.PanelForm = ui.AbstractWidget.extend({
		defaults: {
			fields: null	// (required) instanceof app.ux.FieldCollection
		},
		init: function(parent) {
			this._super();
			this.el = $(this._main_template());
			this.attach( parent );
		},
		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "uiPanelForm", children: this.config.fields.fields.map(this._field_template, this) };
		},
		_field_template: function(field) {
			return { tag: "LABEL", cls: "uiPanelForm-field", children: [
				{ tag: "DIV", cls: "uiPanelForm-label", children: [ field.label, acx.ut.require_template(field) ] },
				field
			]}
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
			title: acx.text("General.Help")
		},
		init: function() {
			this._super();
			this.body.append(acx.text(this.config.ref));
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
		_body_template: function() {
			var body = this._super();
			body.child = new es.JsonPretty({ obj: this.config.json });
			return body;
		}
	});

})( this.app );

(function( acx, raphael ) {

	window.es = {
		ui: {}
	};

	es.ui.SidebarSection = app.ui.AbstractWidget.extend({
		defaults: {
			title: "",
			help: null,
			body: null,
			open: false
		},
		init: function() {
			this._super();
			this.el = $(this._main_template());
			this.body = this.el.children(".sidebarSection-body");
			this.config.open && ( this.el.addClass("shown") && this.body.css("display", "block") );
		},
		_showSection_handler: function(jEv) {
			var shown = $(jEv.target).closest(".sidebarSection")
				.toggleClass("shown")
					.children(".sidebarSection-body").slideToggle(200, function() { this.fire("animComplete", this); }.bind(this))
				.end()
				.hasClass("shown");
			this.fire(shown ? "show" : "hide", this);
		},
		_showHelp_handler: function(jEv) {
			new app.ui.HelpPanel({ref: this.config.help});
			jEv.stopPropagation();
		},
		_main_template: function() { return (
			{ tag: "DIV", cls: "sidebarSection", children: [
				(this.config.title && { tag: "DIV", cls: "sidebarSection-head", onclick: this._showSection_handler, children: [
					this.config.title,
					( this.config.help && { tag: "SPAN", cls: "sidebarSection-help textLink es-right", onclick: this._showHelp_handler, text: acx.text("General.HelpGlyph") } )
				] }),
				{ tag: "DIV", cls: "sidebarSection-body", child: this.config.body }
			] }
		); }
	});

	es.ui.Table = app.ui.Table.extend({
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
				title: acx.text("Browser.ResultSourcePanelTitle"),
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

	es.ui.QueryFilter = app.ui.AbstractWidget.extend({
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
			var fieldNameParts = fieldName.split('.');
			var namePart = 0;
			var spec = this.metadata.fields[fieldNameParts[namePart]];
			while (typeof spec.fields !== "undefined") {
				namePart++;
				if (typeof spec.fields[fieldNameParts[namePart]] === "undefined") {
					break;
				}
				spec =  spec.fields[fieldNameParts[namePart]];
			}
			return spec;
		},
		_selectAlias_handler: function(jEv) {
			var indices = (jEv.target.selectedIndex === 0) ? [] : this.metadata.getIndices($(jEv.target).val());
			$(".queryFilter-index").each(function(i, el) {
				var jEl = $(el);
				if(indices.contains(jEl.text()) !== jEl.hasClass("selected")) {
					jEl.click();
				}
			});
			this.requestUpdate(jEv);
		},
		_selectIndex_handler: function(jEv) {
			var jEl = $(jEv.target).closest(".queryFilter-index");
			jEl.toggleClass("selected");
			var selected = jEl.hasClass("selected");
			this.query.setIndex(jEl.text(), selected);
			if(selected) {
				var types = this.metadata.getTypes(this.query.indices);
				this.el.find("DIV.queryFilter-type.selected").each(function(n, el) {
					if(! types.contains($(el).text())) {
						$(el).click();
					}
				});
			}
			this.requestUpdate(jEv);
		},
		_selectType_handler: function(jEv) {
			var jEl = $(jEv.target).closest(".queryFilter-type");
			jEl.toggleClass("selected");
			var type = jEl.text(), selected = jEl.hasClass("selected");
			this.query.setType(type, selected);
			if(selected) {
				var indices = this.metadata.types[type].indices;
				// es throws a 500 if searching an index for a type it does not contain - so we prevent that
				this.el.find("DIV.queryFilter-index.selected").each(function(n, el) {
					if(! indices.contains($(el).text())) {
						$(el).click();
					}
				});
				// es throws a 500 if you specify types from different indicies with _all
				jEl.siblings(".queryFilter-type.selected").forEach(function(el) {
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
					section.body.append(new es.ui.DateHistogram({ printEl: section.body.find("INPUT"), cluster: this.cluster, query: this.query, spec: spec }));
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
						if (fieldNameParts[part] != fieldNameParts[part - 1]) {
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
			jEl.siblings(".queryFilter-rangeHintFrom")
				.text(acx.text("QueryFilter.DateRangeHint.from", range.start && new Date(range.start).toUTCString()));
			jEl.siblings(".queryFilter-rangeHintTo")
				.text(acx.text("QueryFilter.DateRangeHint.to", range.end && new Date(range.end).toUTCString()));
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
			return { tag: "DIV", id: this.id(), cls: "queryFilter", children: [
				this._aliasSelector_template(),
				this._indexSelector_template(),
				this._typesSelector_template(),
				this._filters_template()
			] };
		},
		_aliasSelector_template: function() {
			var aliases = acx.eachMap(this.metadata.aliases, function(alias) { return alias; } );
			aliases.unshift( acx.text("QueryFilter.AllIndices") );
			return { tag: "DIV", cls: "section queryFilter-aliases", child:
				{ tag: "SELECT", onChange: this._selectAlias_handler, children: aliases.map(acx.ut.option_template) }
			};
		},
		_indexSelector_template: function() {
			return { tag: "DIV", cls: "section queryFilter-indices", children: [
				{ tag: "HEADER", text: acx.text("QueryFilter-Header-Indices") },
				{ tag: "DIV", onClick: this._selectIndex_handler, children: acx.eachMap(this.metadata.indices, function(name, data) {
					return { tag: "DIV", cls: "booble queryFilter-index", text: name };
				})}
			] };
		},
		_typesSelector_template: function() {
			return { tag: "DIV", cls: "section queryFilter-types", children: [
				{ tag: "HEADER", text: acx.text("QueryFilter-Header-Types") },
				{ tag: "DIV", onClick: this._selectType_handler, children: acx.eachMap(this.metadata.types, function(name, data) {
					return { tag: "DIV", cls: "booble queryFilter-type", text: name };
				})}
			] };
		},
		_filters_template: function() {
			return { tag: "DIV", cls: "section queryFilter-filters", children: [
				{ tag: "HEADER", text: acx.text("QueryFilter-Header-Fields") },
				{ tag: "DIV", children: acx.eachMap(this.metadata.fields, function(name, data) {
					return new es.ui.SidebarSection({
						title: name,
						help: this.helpTypeMap[data.type],
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
				{ tag: "PRE", cls: "hint queryFilter-rangeHintFrom", text: acx.text("QueryFilter.DateRangeHint.from", "")},
				{ tag: "PRE", cls: "hint queryFilter-rangeHintTo", text: acx.text("QueryFilter.DateRangeHint.to", "") }
			]};
		},
		_numericFilter_template: function(spec) {
			return { tag: "INPUT", data: { spec: spec }, onKeyup: this._numericFilterChange_handler };
		},
		_booleanFilter_template: function(spec) {
			return { tag: "SELECT", data: { spec: spec }, onChange: this._booleanFilterChange_handler,
				children: [ acx.text("QueryFilter.AnyValue"), "true", "false" ].map( function( val ) {
					return { tag: "OPTION", value: val, text: val };
				})
			};
		},
		_multiFieldFilter_template: function(section, spec) {
			return {
				tag : "DIV", cls : "subMultiFields", children : acx.eachMap(spec.fields, function(name, data) {
					if (name == spec.field_name) {
						section.config.title = spec.field_name + "." + name;
						return this._openFilter_handler(section);
					}
					return new es.ui.SidebarSection({
						title : data.field_name, help : this.helpTypeMap[data.type], onShow : this._openFilter_handler
					});
				}, this)
			};
		}	
	});

	es.ui.Page = app.ui.AbstractWidget.extend({
		show: function() {
			this.el.show();
		},
		hide: function() {
			this.el.hide();
		}
	});

	es.ui.Browser = es.ui.Page.extend({
		defaults: {
			cluster: null  // (required) instanceof app.services.Cluster
		},
		init: function() {
			this._super();
			this.cluster = this.config.cluster;
			this.query = new app.data.Query( { cluster: this.cluster } );
			this._refreshButton = new app.ui.Button({
				label: acx.text("General.RefreshResults"),
				onclick: function( btn ) {
					this.query.query();
				}.bind(this)
			});
			this.el = $(this._main_template());
			new app.data.MetaDataFactory({
				cluster: this.cluster,
				onReady: function(metadata) {
					this.metadata = metadata;
					this.store = new app.data.QueryDataSourceInterface( { metadata: metadata, query: this.query } );
					this.queryFilter = new es.ui.QueryFilter({ metadata: metadata, query: this.query });
					this.queryFilter.attach(this.el.find("> .browser-filter") );
					this.resultTable = new es.ui.Table( {
						onHeaderClick: this._changeSort_handler,
						store: this.store
					} );
					this.resultTable.attach( this.el.find("> .browser-table") );
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
			return { tag: "DIV", cls: "browser", children: [
				new app.ui.Toolbar({
					label: acx.text("Browser.Title"),
					left: [ ],
					right: [ this._refreshButton ]
				}),
				{ tag: "DIV", cls: "browser-filter" },
				{ tag: "DIV", cls: "browser-table" }
			] };
		}
	});

	es.ui.AnyRequest = es.ui.Page.extend({
		defaults: {
			cluster: null,       // (required) instanceof app.services.Cluster
			path: "_search",     // default uri to send a request to
			query: { query: { match_all: { }}},
			transform: "  return root;" // default transformer function (does nothing)
		},
		init: function(parent) {
			this._super();
			this.history = app.services.storage.get("anyRequestHistory") || [ { type: "POST", path: this.config.path, query : JSON.stringify(this.config.query), transform: this.config.transform } ];
			this.el = $(this._main_template());
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
			this.outEl = this.el.find("DIV.anyRequest-out");
			this.errEl = this.el.find("DIV.anyRequest-jsonErr");
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
		_request_handler: function(jEv) {
			if(! this._validateJson_handler()) {
				return;
			}
			var path = this.pathEl.val(),
					type = this.typeEl.val(),
					query = JSON.stringify(JSON.parse(this.dataEl.val())),
					transform = this.transformEl.val(),
					base_uri = this.base_uriEl.val();
			if(jEv && jEv.originalEvent) { // if the user click request
				if(this.timer) {
					window.clearTimeout(this.timer); // stop any cron jobs
				}
				delete this.prevData; // remove data from previous cron runs
				this.outEl.text(acx.text("AnyRequest.Requesting"));
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
				app.services.storage.set("anyRequestHistory", this.history);
				this.el.find("UL.anyRequest-history")
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
					this.outEl.append(new es.ui.Table({
						width: this.outEl.width() - 23,
						store: store
					} ) );
					store.results(data);
				} catch(e) {
					this.errEl.text("Results Table Failed: " + e.message);
				}
			}
			if(this.asJsonEl.attr("checked")) {
				this.outEl.append(new es.JsonPretty({ obj: data }));
			}
			if(this.cronEl.val() > 0) {
				this.timer = window.setTimeout(function(){
					this._request_handler();
				}.bind(this), this.cronEl.val());
			}
			this.prevData = data;
		},
		_validateJson_handler: function(jEv) {
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
		_showSection_handler: function(jEv) {
			$(jEv.target).closest(".sidebar-section").children(".sidebar-subbody").slideToggle(200);
		},
		_historyClick_handler: function(jEv) {
			var item = $(jEv.target).closest("LI").data("item");
			this.setHistoryItem(item);
		},
		_main_template: function() {
			return { tag: "DIV", cls: "anyRequest", children: [
				{ tag: "DIV", cls: "anyRequest-request", children: [
					new es.ui.SidebarSection({
						open: false,
						title: acx.text("AnyRequest.History"),
						body: { tag: "UL", onclick: this._historyClick_handler, cls: "anyRequest-history", children: this.history.map(this._historyItem_template, this)	}
					}),
					new es.ui.SidebarSection({
						open: true,
						title: acx.text("AnyRequest.Query"),
						body: { tag: "DIV", children: [
							{ tag: "INPUT", type: "text", name: "base_uri", value: this.config.cluster.config.base_uri },
							{ tag: "BR" },
							{ tag: "INPUT", type: "text", name: "path", value: this.config.path },
							{ tag: "SELECT", name: "method", children: ["POST", "GET", "PUT", "DELETE"].map(acx.ut.option_template) },
							{ tag: "TEXTAREA", name: "body", rows: 20, text: JSON.stringify(this.config.query) },
							{ tag: "BUTTON", css: { cssFloat: "right" }, type: "button", child: { tag: "B", text: acx.text("AnyRequest.Request") }, onclick: this._request_handler },
							{ tag: "BUTTON", type: "button", text: acx.text("AnyRequest.ValidateJSON"), onclick: this._validateJson_handler },
							{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", name: "pretty" }, acx.text("AnyRequest.Pretty") ] },
							{ tag: "DIV", cls: "anyRequest-jsonErr" }
						]}
					}),
					new es.ui.SidebarSection({
						title: acx.text("AnyRequest.Transformer"),
						help: "AnyRequest.TransformerHelp",
						body: { tag: "DIV", children: [
							{ tag: "CODE", text: "function(root, prev) {" },
							{ tag: "BR" },
							{ tag: "TEXTAREA", name: "transform", rows: 5, text: this.config.transform },
							{ tag: "BR" },
							{ tag: "CODE", text: "}" }
						] }
					}),
					new es.ui.SidebarSection({
						title: acx.text("AnyRequest.RepeatRequest"),
						body: { tag: "DIV", children: [
							acx.text("AnyRequest.RepeatRequestSelect"), " ",
							{ tag: "SELECT", name: "cron", children: [
								{ value: 0, text: "do not repeat" },
								{ value: 1000, text: "second" },
								{ value: 1000 * 2, text: "2 seconds" },
								{ value: 1000 * 5, text: "5 seconds" },
								{ value: 1000 * 20, text: "20 seconds" },
								{ value: 1000 * 60, text: "minute" },
								{ value: 1000 * 60 * 10, text: "10 minutes" },
								{ value: 1000 * 60 * 60, text: "hour" }
							].map(function(op) { return acx.extend({ tag: "OPTION"}, op); }) }
						] }
					}),
					new es.ui.SidebarSection({
						title: acx.text("AnyRequest.DisplayOptions"),
						help: "AnyRequest.DisplayOptionsHelp",
						body: { tag: "DIV", children: [
							{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", checked: true, name: "asJson" }, acx.text("AnyRequest.AsJson") ] },
							{ tag: "BR" },
							{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", name: "asGraph" }, acx.text("AnyRequest.AsGraph") ] },
							{ tag: "BR" },
							{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", name: "asTable" }, acx.text("AnyRequest.AsTable") ] }
						] }
					})
				] },
				{ tag: "DIV", cls: "anyRequest-out" }
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
	
	es.ui.SimpleGetQuery = app.ui.AbstractWidget.extend({
		defaults: {
//		cluster: null,	// (required) instance of app.services.Cluster
//		path: "",					// (required) path to request
		},
		
		init: function(parent) {
			this._super();
			this.el = $(this._main_template());
			this.config.cluster.get(this.config.path, this._update_handler);
		},
		
		_update_handler: function(data) {
			this.el.find("> .simpleGetQuery-out").empty().append(new es.JsonPretty({ obj: data }));
		},

		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "simpleGetQuery", children: [
				{ tag: "DIV", cls: "simpleGetQuery-out" }
			] };
		}
	});

	es.ui.ClusterOverview = es.ui.Page.extend({
		defaults: {
			cluster: null // (reqired) an instanceof app.services.Cluster
		},
		init: function() {
			this._super();
			this._resetTimer = null;
			this._redrawValue = -1;
			this._refreshButton = new app.ui.SplitButton({
				label: acx.text("General.RefreshResults"),
				items: [
					{ label: acx.text("General.ManualRefresh"), value: -1, selected: true },
					{ label: acx.text("General.RefreshQuickly"), value: 100 },
					{ label: acx.text("General.Refresh5seconds"), value: 5000 },
					{ label: acx.text("General.Refresh1minute"), value: 60000 }
				],
				onselect: function( btn, event ) {
					this._redrawValue = event.value;
					if( event.value < 0 ) {
						window.clearTimeout( this._resetTimer );
					} else {
						this.redraw( "reset" );
					}
				}.bind( this ),
				onclick: function( btn, event ) {
					this.redraw("reset");
				}.bind(this)
			});

			this.el = $(this._main_template());
			this.tablEl = this.el.find(".clusterOverview-table");
			this.cluster = this.config.cluster;
			this.redraw("reset");
			this.on( "drawn", function( self ) {
				if( self._redrawValue >= 0 ) {
					self._resetTimer = setTimeout( function() {
						self.redraw( "reset" );
					}, self._redrawValue );
				}
			} );
		},
		redraw: function(command) {
			if(command === "reset") {
				window.clearTimeout( this._resetTimer );
				this._refreshButton.disable();
				this.clusterState = null;
				this.status = null;
				this.nodeStats = null;
				this.clusterNodes = null;
				this.cluster.get("_cluster/state", this._clusterState_handler);
				this.cluster.get("_status", this._status_handler);
				this.cluster.get("_cluster/nodes", this._clusterNodes_handler);
				this.cluster.get("_cluster/nodes/stats?all=true", this._clusterNodeStats_handler);
			} else if(this.status && this.clusterState && this.nodeStats && this.clusterNodes) {
				var clusterState = this.clusterState;
				var status = this.status;
				var nodeStats = this.nodeStats;
				var clusterNodes = this.clusterNodes;
				var nodes = [];
				var indices = [];
				var cluster = { nodes: nodes };
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
				acx.each(clusterNodes.nodes, function(name, node) {
					getIndexForNode(name);
				});

				var indexNames = [];
				acx.each(clusterState.routing_table.indices, function(name, index){
					indexNames.push(name);
				});
				indexNames.sort().forEach(function(name) {
					var index = clusterState.routing_table.indices[name];
					acx.each(index.shards, function(name, shard) {
						shard.forEach(function(replica){
							var node = replica.node;
							if(node === null) { node = "Unassigned"; }
							var index = replica.index;
							var shard = replica.shard;
							var routings = nodes[getIndexForNode(node)].routings;
							var indexIndex = getIndexForIndex(routings, index);
							var replicas = routings[indexIndex].replicas;
							if(node === "Unassigned" || !status.indices[index].shards[shard]) {
								replicas.push({ replica: replica });
							} else {
								replicas[shard] = {
									replica: replica,
									status: status.indices[index].shards[shard].filter(function(replica) {
										return replica.routing.node === node;
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
				acx.each(clusterState.metadata.indices, function(name, index) {
					if(index.state === "close") {
						indices.push({
							name: name,
							state: "close",
							metadata: index,
							status: null
						});
					}
				});
				cluster.nodes.forEach(function(node) {
					node.stats = nodeStats.nodes[node.name];
					node.cluster = clusterNodes.nodes[node.name];
					for(var i = 0; i < indices.length; i++) {
						node.routings[i] = node.routings[i] || { name: indices[i].name, replicas: [] };
						node.routings[i].max_number_of_shards = indices[i].metadata.settings["index.number_of_shards"];
						node.routings[i].open = indices[i].state === "open";
					}
				});
				var aliasesIndex = {};
				var aliases = [];
				var indexClone = indices.map(function() { return false; });
				acx.each(clusterState.metadata.indices, function(name, index) {
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
				indices.unshift({ name: null });
				this.tablEl.empty().append(this._cluster_template(cluster, indices));
				this._refreshButton.enable();
				this.fire("drawn", this );
			}
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
		_newIndex_handler: function() {
			var fields = new app.ux.FieldCollection({
				fields: [
					new app.ui.TextField({ label: acx.text("ClusterOverView.IndexName"), name: "_name", require: true }),
					new app.ui.TextField({
						label: acx.text("ClusterOverview.NumShards"),
						name: "number_of_shards",
						value: "5",
						require: function( val ) { return parseInt( val, 10 ) >= 1; }
					}),
					new app.ui.TextField({
						label: acx.text("ClusterOverview.NumReplicas"),
						name: "number_of_replicas",
						value: "1",
						require: function( val ) { return parseInt( val, 10 ) >= 0; }
					})
				]
			});
			var dialog = new app.ui.DialogPanel({
				title: acx.text("ClusterOverview.NewIndex"),
				body: new app.ui.PanelForm({ fields: fields }),
				onCommit: function(panel, args) {
					if(fields.validate()) {
						var data = fields.getData();
						var name = data["_name"];
						delete data["_name"];
						this.config.cluster.put( name, JSON.stringify({ settings: { index: data } }), function(d) {
							dialog.close();
							alert(JSON.stringify(d));
							this.redraw("reset");
						}.bind(this) );
					}
				}.bind(this)
			}).open();
		},
		_newAliasAction_handler: function(index) {
			var fields = new app.ux.FieldCollection({
				fields: [
					new app.ui.TextField({ label: acx.text("AliasForm.AliasName"), name: "alias", require: true })
				]
			});
			var dialog = new app.ui.DialogPanel({
				title: acx.text("AliasForm.NewAliasForIndexName", index.name),
				body: new app.ui.PanelForm({ fields: fields }),
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
							this.redraw("reset");
						}.bind(this) );
					}
				}.bind(this)
			}).open();
		},
		_deleteIndexAction_handler: function(index) {
			if( prompt( acx.text("AliasForm.DeleteAliasMessage", acx.text("Command.DELETE"), index.name ) ) === acx.text("Command.DELETE") ) {
				this.cluster["delete"](index.name, null, function(r) {
					alert(JSON.stringify(r));
					this.redraw("reset");
				}.bind(this) );
			}
		},
		_postIndexAction_handler: function(action, index, redraw) {
			this.cluster.post(index.name + "/" + action, null, function(r) {
				alert(JSON.stringify(r));
				redraw && this.redraw("reset");
			}.bind(this));
		},
		_testAnalyser_handler: function(index) {
			this.cluster.get(index.name + "/_analyze?text=" + prompt( acx.text("IndexCommand.TextToAnalyze") ), function(r) {
				alert(JSON.stringify(r, true, "  "));
			});
		},
		_showdownNode_handler: function(node) {
			if(prompt( acx.text("IndexCommand.ShutdownMessage", acx.text("Command.SHUTDOWN"), node.cluster.name ) ) === acx.text("Command.SHUTDOWN") ) {
				this.cluster.post( "_cluster/nodes/" + node.name + "/_shutdown", null, function(r) {
					alert(JSON.stringify(r));
					this.redraw("reset");
				}.bind(this));
			}
		},
		_replica_template: function(replica) {
			var r = replica.replica;
			return { tag: "DIV",
				cls: "clusterOverview-replica" + (r.primary ? " primary" : "") + ( " state-" + r.state ),
				text: r.shard.toString(),
				onclick: function() { new app.ui.JsonPanel({
					json: replica.status || replica.replica,
					title: r.index + "/" + r.node + " [" + r.shard + "]" });
				}
			};
		},
		_routing_template: function(routing) {
			var cell = { tag: "TD", cls: "clusterOverview-routing" + (routing.open ? "" : " close"), children: [] };
			for(var i = 0; i < routing.replicas.length; i++) {
				if(i % routing.max_number_of_shards === 0 && i > 0) {
					cell.children.push({ tag: "BR" });
				}
				if( i in (routing.replicas)) {
					cell.children.push(this._replica_template(routing.replicas[i]));
				} else {
					cell.children.push( { tag: "DIV", cls: "clusterOverview-nullReplica" } );
				}
			}
			return cell;
		},
		_node_template: function(node) {
			return { tag: "TR", cls: "clusterOverview-node" + (node.master_node ? " master": ""), children: [
				{ tag: "TH", children: node.name === "Unassigned" ? [
					{ tag: "DIV", cls: "clusterOverview-title", text: node.name }
				] : [
					{ tag: "DIV", children: [
						{ tag: "SPAN", cls: "clusterOverview-title", text: node.cluster.name },
						" ",
						{ tag: "SPAN", text: node.name }
					]},
					{ tag: "DIV", text: node.cluster.http_address },
					{ tag: "DIV", cls: "clusterOverview-controls", children: [
						new app.ui.MenuButton({
							label: acx.text("NodeInfoMenu.Title"),
							menu: new app.ui.MenuPanel({
								items: [
									{ text: acx.text("NodeInfoMenu.ClusterNodeInfo"), onclick: function() { new app.ui.JsonPanel({ json: node.cluster, title: node.name });} },
									{ text: acx.text("NodeInfoMenu.NodeStats"), onclick: function() { new app.ui.JsonPanel({ json: node.stats, title: node.name });} }
								]
							})
						}),
						new app.ui.MenuButton({
							label: acx.text("NodeActionsMenu.Title"),
							menu: new app.ui.MenuPanel({
								items: [
									{ text: acx.text("NodeActionsMenu.Shutdown"), onclick: function() { this._showdownNode_handler(node); }.bind(this) }
								]
							})
						})
					] }
				] }
			].concat(node.routings.map(this._routing_template, this))};
		},
		_indexHeader_template: function(index) {
			var closed = index.state === "close";
			var line1 = closed ? "index: close" : ( "size: " + (index.status && index.status.index ? index.status.index.primary_size + " (" + index.status.index.size + ")" : "unknown" ) ); 
			var line2 = closed ? "\u00A0" : ( "docs: " + (index.status && index.status.docs ? index.status.docs.num_docs + " (" + index.status.docs.max_doc + ")" : "unknown" ) );
			return index.name ? { tag: "TH", cls: (closed ? "close" : ""), children: [
				{ tag: "DIV", cls: "clusterOverview-title", text: index.name },
				{ tag: "DIV", text: line1 },
				{ tag: "DIV", text: line2 },
				{ tag: "DIV", cls: "clusterOverview-controls", children: [
					new app.ui.MenuButton({
						label: acx.text("IndexInfoMenu.Title"),
						menu: new app.ui.MenuPanel({
							items: [
								{ text: acx.text("IndexInfoMenu.Status"), onclick: function() { new app.ui.JsonPanel({ json: index.status, title: index.name }); } },
								{ text: acx.text("IndexInfoMenu.Metadata"), onclick: function() { new app.ui.JsonPanel({ json: index.metadata, title: index.name }); } }
							]
						})
					}),
					new app.ui.MenuButton({
						label: acx.text("IndexActionsMenu.Title"),
						menu: new app.ui.MenuPanel({
							items: [
								{ text: acx.text("IndexActionsMenu.NewAlias"), onclick: function() { this._newAliasAction_handler(index); }.bind(this) },
								{ text: acx.text("IndexActionsMenu.Refresh"), onclick: function() { this._postIndexAction_handler("_refresh", index, false); }.bind(this) },
								{ text: acx.text("IndexActionsMenu.Flush"), onclick: function() { this._postIndexAction_handler("_flush", index, false); }.bind(this) },
								{ text: acx.text("IndexActionsMenu.Snapshot"), disabled: closed, onclick: function() { this._postIndexAction_handler("_gateway/snapshot", index, false); }.bind(this) },
								{ text: acx.text("IndexActionsMenu.Analyser"), onclick: function() { this._testAnalyser_handler(index); }.bind(this) },
								{ text: closed ? acx.text("IndexActionsMenu.Open") : acx.text("IndexActionsMenu.Close"), onclick: function() { this._postIndexAction_handler(closed ? "_open" : "_close", index, true); }.bind(this) },
								{ text: acx.text("IndexActionsMenu.Delete"), onclick: function() { this._deleteIndexAction_handler(index); }.bind(this) }
							]
						})
					})
				] }
			]} : { tag: "TH" };
		},
		_alias_template: function(alias, row) {
			return { tag: "TR", children: [ { tag: "TD"	} ].concat(alias.indices.map(function(index, i) {
				if (index) {
					return {
						tag: "TD",
						css: { background: "#" + "9ce9c7fc9".substr((row+6)%7,3) },
						cls: "clusterOverview-hasAlias" + ( alias.min === i ? " min" : "" ) + ( alias.max === i ? " max" : "" ),
						text: alias.name,
						children: [
							{	tag: 'SPAN',
								text: acx.text("General.CloseGlyph"),
								cls: 'clusterOverview-hasAlias-remove',
								onclick: function() {
									var command = {
										"actions" : [
											{ "remove" : { "index" : index.name, "alias" : alias.name } }
										]
									};
									this.config.cluster.post('_aliases', JSON.stringify(command), function(d) {
										alert(JSON.stringify(d));
										this.redraw("reset");
									}.bind(this) );
								}.bind(this)
							}
						]
					};
				}
				else {
					return { tag: "TD" };
				}
			},
			this)) };
		},
		_cluster_template: function(cluster, indices) {
			function nodeNameCmp(first, second) {
				if (!(first.cluster && second.cluster)) {
					return 0;
				}
				var a = first.cluster.name;
				var b = second.cluster.name;
				if (a.toString() < b.toString()) {
					return -1;
				}
				if (a.toString() > b.toString()) {
					return 1;
				}
				return 0;
			}
			return { tag: "TABLE", cls: "clusterOverview-cluster", children: [
				{ tag: "THEAD", child: { tag: "TR", children: indices.map(this._indexHeader_template, this) } },
				cluster.aliases.length && { tag: "TBODY", children: cluster.aliases.map(this._alias_template, this) },
				{ tag: "TBODY", children: cluster.nodes.sort(nodeNameCmp).map(this._node_template, this) }
			] };
		},
		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "clusterOverview", children: [
				new app.ui.Toolbar({
					label: acx.text("Overview.PageTitle"),
					left: [
						new app.ui.Button({
							label: acx.text("ClusterOverview.NewIndex"),
							onclick: this._newIndex_handler
						})
					],
					right: [
						this._compactToggle,
						this._refreshButton
					]
				}),
				{ tag: "DIV", cls: "clusterOverview-table" }
			] };
		}
	});

	es.ui.DateHistogram = app.ui.AbstractWidget.extend({
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
			this.query.on("results", this._facet_handler);
			this.buildHistogram();
		},
		buildHistogram: function(query) {
			this.statFacet = this.query.addFacet({
				statistical: { field: this.config.spec.field_name },
				global: true
			});
			this.query.query();
			this.query.removeFacet(this.statFacet);
		},
		_stat_handler: function(query, results) {
			if(! results.facets[this.statFacet]) { return; }
			this.stats = results.facets[this.statFacet];
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
			this.dateFacet = this.query.addFacet({
					date_histogram : {
						field: this.config.spec.field_name,
						interval: this.intervalName,
						global: true
					}
			});
			this.query.query();
			this.query.removeFacet(this.dateFacet);
		},
		_facet_handler: function(query, results) {
			if(! results.facets[this.dateFacet]) { return; }
			var buckets = [], range = this.intervalRange;
			var min = Math.floor(this.stats.min / range) * range;
			var prec = [ "year", "month", "day", "hour", "minute", "second" ].indexOf(this.intervalName);
			results.facets[this.dateFacet].entries.forEach(function(entry) {
				buckets[parseInt((entry.time - min) / range , 10)] = entry.count;
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
			{ tag: "DIV", cls: "dateHistogram loading", css: { height: "50px" }, children: [
				acx.text("General.LoadingFacets")
			] }
		); }
	});

	var coretype_map = {
		"string" : "string",
		"long" : "number",
		"integer" : "number",
		"float" : "number",
		"double" : "number",
		"ip" : "number",
		"date" : "date",
		"boolean" : "boolean",
		"binary" : "binary"
	};
	var default_property_map = {
		"string" : { "store" : "no", "index" : "analysed" },
		"number" : { "store" : "no", "precision_steps" : 4 },
		"date" : { "store" : "no", "format" : "dateOptionalTime", "index": "yes", "precision_steps": 4 },
		"boolean" : { "store" : "no", "index": "yes" },
		"binary" : { }
	};

	es.JsonPretty = app.ui.AbstractWidget.extend({
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
			var t = $(jEv.target).closest(".jsonPretty-name").closest("LI");
			if(t.length === 0 || t.parents(".jsonPretty-minimised").length > 0) { return; }
			t.toggleClass("jsonPretty-minimised");
			jEv.stopPropagation();
		},
		
		_main_template: function() {
			try {
					return { tag: "DIV", cls: "jsonPretty", children: this.pretty.parse(this.config.obj) };
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
				var results = value.map(function(v) {
					return { tag: "LI", cls: this.expando(v), child: this['parse'](v) };
				}, this);
				return [ "[ ", ((results.length > 0) ? { tag: "UL", cls: "jsonPretty-array", children: results } : null), "]" ];
			},
			"object": function (value) {
				var results = [];
				for (var member in value) {
					results.push({ tag: "LI", cls: this.expando(value[member]), children:  [ this['value']('name', member), ': ', this['parse'](value[member]) ] });
				}
				return [ "{ ", ((results.length > 0) ? { tag: "UL", cls: "jsonPretty-object", children: results } : null ),  "}" ];
			},
			"number": function (value) {
				return this['value']('number', value.toString());
			},
			"string": function (value) {
				return this['value']('string', value.toString());
			},
			"boolean": function (value) {
				return this['value']('boolean', value.toString());
			},
			"value": function (type, value) {
				if (/^(http|https|file):\/\/[^\s]+$/.test(value)) {
					return this['value'](type, { tag: "A", href: value, target: "_blank", text: value } );
				}
				return { tag: "SPAN", cls: "jsonPretty-" + type, text: value };
			}
		}
	});

	es.BoolQuery = app.ux.Observable.extend({
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
				facets: {}
			};
			this.defaultClause = this.addClause();
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
			} else {
				query[field] = value;
			}
			clause[op] = query;
			this.search.query.bool[bool].push(clause);
			return clause;
		},
		getData: function() {
			return JSON.stringify(this.search);
		}
	});

	es.AbstractQuery = app.ui.AbstractWidget.extend({
		defaults: {
			base_uri: "http://localhost:9200/"   // the default ElasticSearch host
		},

		_request_handler: function(params) {
			$.ajax(acx.extend({
				url: this.config.base_uri + params.path,
				type: "POST",
				dataType: "json",
				error: function(xhr, type, message) {
					if(xhr.responseText != null) {
						var obj = $.parseJSON(xhr.responseText);
						if (!obj) {
							return;
						}
						$('.es-out').text(obj.error || 'Unknown error!')
							.css('white-space', 'pre');
					}
				}
			}, params));
		}
	});
	
	es.ClusterConnect = es.AbstractQuery.extend({
		
		init: function(parent) {
			this._super();
			this.el = $(this._main_template());
			this.attach( parent );
			this.nameEl = this.el.find(".es-header-clusterName");
			this.statEl = this.el.find(".es-header-clusterStatus");
			this.statEl.text("cluster health: not connected").css("background", "red");
			this._request_handler({ type: "GET", path: "", success: this._node_handler });
			this._request_handler({	type: "GET", path: "_cluster/health", success: this._health_handler });
		},
		
		_node_handler: function(data) {
			if(data) {
				this.nameEl.text(data.name);
				this.fire("reconnect", this.base_uri);
			}
		},
		
		_health_handler: function(data) {
			if(data) {
				this.statEl.text(acx.text("Header.ClusterHealth", data.status, data.number_of_nodes, data.active_primary_shards ) ).css("background", data.status);
				this.fire("status", data.status);
			}
		},
		
		_reconnect_handler: function() {
			var base_uri = this.el.find(".es-header-uri").val();
			$("body").empty().append(new app.App("body", { id: "es", base_uri: base_uri }));
		},
		
		_main_template: function() {
			return { tag: "SPAN", cls: "es-cluster", children: [
				{ tag: "INPUT", type: "text", cls: "es-header-uri", onkeyup: function( jEv ) {
					if(jEv.which === 13) {
						jEv.preventDefault();
						this._reconnect_handler();
					}
				}.bind(this), id: this.id("baseUri"), value: this.config.base_uri },
				{ tag: "BUTTON", type: "button", text: acx.text("Header.Connect"), onclick: this._reconnect_handler },
				{ tag: "SPAN", cls: "es-header-clusterName" },
				{ tag: "SPAN", cls: "es-header-clusterStatus" }
			]};
		}
	});

	es.ui.StructuredQuery = es.ui.Page.extend({
		init: function() {
			this.q = new es.StructuredQuery( this.config );
			this.el = this.q.el;
		}
	});

	es.StructuredQuery = es.AbstractQuery.extend({
		defaults: {
			cluster: null  // (required) instanceof app.services.Cluster
		},
		init: function(parent) {
			this._super();
			this.selector = new es.IndexSelector({
				onIndexChanged: this._indexChanged_handler,
				base_uri: this.config.base_uri
			});
			this.el = $(this._main_template());
			this.out = this.el.find("DIV.es-out");
			this.attach( parent );
		},
		
		_indexChanged_handler: function(index) {
			this.filter && this.filter.remove();
			this.filter = new es.FilterBrowser({
				cluster: this.config.cluster,
				base_uri: this.config.base_uri,
				index: index,
				onStaringSearch: function() { this.el.find("DIV.es-out").text( acx.text("General.Searching") ); this.el.find("DIV.es-searchSource").hide(); }.bind(this),
				onSearchSource: this._searchSource_handler,
				onJsonResults: this._jsonResults_handler,
				onTableResults: this._tableResults_handler
			});
			this.el.find(".es-structuredQuery-body").append(this.filter);
		},
		
		_jsonResults_handler: function(results) {
			this.el.find("DIV.es-out").empty().append(new es.JsonPretty({ obj: results }));
		},
		
		_tableResults_handler: function(results, metadata) {
			// hack up a QueryDataSourceInterface so that StructuredQuery keeps working without using an es.Query object
			var qdi = new app.data.QueryDataSourceInterface({ metadata: metadata, query: new app.data.Query() });
			var tab = new app.ui.Table( {
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
			var searchSourceDiv = this.el.find("DIV.es-searchSource");
			searchSourceDiv.empty().append(new es.JsonPretty({ obj: src }));
			if(typeof JSON !== "undefined") {
				var showRawJSON = $({ tag: "BUTTON", type: "button", text: acx.text("StructuredQuery.ShowRawJson"), id: "showRawJSON", value: JSON.stringify(src), onclick: this._showRawJSON });
				searchSourceDiv.append(showRawJSON);
			}
			searchSourceDiv.show();
		},
		
		_main_template: function() {
			return { tag: "DIV", children: [
				this.selector,
				{ tag: "DIV", cls: "es-structuredQuery-body" },
				{ tag: "DIV", cls: "es-searchSource", css: { display: "none" } },
				{ tag: "DIV", cls: "es-out" }
			]};
		}
	});

	es.FilterBrowser = es.AbstractQuery.extend({
		defaults: {
			cluster: null,  // (required) instanceof app.services.Cluster
			index: "" // (required) name of the index to query
		},

		init: function(parent) {
			this._super();
			this.el = $(this._main_template());
			this.filtersEl = this.el.find(".es-filterBrowser-filters");
			this.attach( parent );
			new app.data.MetaDataFactory({ cluster: this.config.cluster, onReady: function(metadata, eventData) {
				this.metadata = metadata;
				this._createFilters_handler(eventData.originalData.metadata.indices);
			}.bind(this) });
		},

		_createFilters_handler: function(data) {
			var filters = [];
			function scan_properties(path, obj) {
				if(obj.properties) {
					for(var prop in obj.properties) {
						scan_properties(path.concat(prop), obj.properties[prop]);
					}
				} else {
					filters.push( { path: path, type: obj.type, meta: obj } );
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
			$(jEv.target).closest("DIV.es-filterBrowser-row").remove();
			if(this.filtersEl.children().length === 0) {
				this._addFilterRow_handler();
			}
		},
		
		_search_handler: function() {
			var search = new es.BoolQuery();
			this.fire("staringSearch");
			this.filtersEl.find(".es-filterBrowser-row").each(function(i, row) {
				row = $(row);
				var bool = row.find(".es-bool").val();
				var field = row.find(".es-field").val();
				var op = row.find(".es-op").val();
				var value = {};
				if(field === "match_all") {
					op = "match_all";
				} else if(op === "range") {
					var lowqual = row.find(".es-lowqual").val(),
						highqual = row.find(".es-highqual").val();
					if(lowqual.length) {
						value[row.find(".es-lowop").val()] = lowqual;
					}
					if(highqual.length) {
						value[row.find(".es-highop").val()] = highqual;
					}
				} else if(op === "fuzzy") {
					var qual = row.find(".es-qual").val(),
						fuzzyqual = row.find(".es-fuzzyqual").val();
					if(qual.length) {
						value["value"] = qual;
					}
					if(fuzzyqual.length) {
						value[row.find(".es-fuzzyop").val()] = fuzzyqual;
					}
				} else {
					value = row.find(".es-qual").val();
				}
				search.addClause(value, field, op, bool);
			});
			if(this.el.find(".es-filterBrowser-showSrc").attr("checked")) {
				this.fire("searchSource", search.search);
			}
			this._request_handler({
				path: this.config.index + "/_search",
				data: search.getData(),
				success: this._results_handler
			});
		},
		
		_results_handler: function(data) {
			if(this.el.find(".es-filterBrowser-outputFormat").val() === "Table") {
				this.fire("tableResults", data, this.metadata);
			} else {
				this.fire("jsonResults", data);
			}
		},
		
		_changeQueryField_handler: function(jEv) {
			var select = $(jEv.target);
			var spec = select.children(":selected").data("spec");
			select.siblings().remove(".es-op,.es-qual,.es-range,.es-fuzzy");
			var ops = [];
			if(spec.type === 'match_all') {
			} else if(spec.type === '_all') {
				ops = ["query_string"];
			} else if(spec.type === 'string') {
				ops = ["term", "wildcard", "prefix", "fuzzy", "range", "query_string", "text"];
			} else if(spec.type === 'long' || spec.type === 'integer' || spec.type === 'float' ||
					spec.type === 'byte' || spec.type === 'short' || spec.type === 'double') {
				ops = ["term", "range", "fuzzy", "query_string"];
			} else if(spec.type === 'date') {
				ops = ["term", "range", "fuzzy", "query_string"];
			} else if(spec.type === 'ip') {
				ops = ["term", "range", "fuzzy", "query_string"];
			}
			select.after({ tag: "SELECT", cls: "es-op", onchange: this._changeQueryOp_handler, children: ops.map(acx.ut.option_template) });
			select.next().change();
		},
		
		_changeQueryOp_handler: function(jEv) {
			var op = $(jEv.target), opv = op.val();
			op.siblings().remove(".es-qual,.es-range,.es-fuzzy");
			if(opv === 'term' || opv === 'wildcard' || opv === 'prefix' || opv === "query_string" || opv === 'text') {
				op.after({ tag: "INPUT", cls: "es-qual", type: "text" });
			} else if(opv === 'range') {
				op.after(this._range_template());
			} else if(opv === 'fuzzy') {
				op.after(this._fuzzy_template());
			}
		},
		
		_main_template: function() {
			return { tag: "DIV", children: [
				{ tag: "DIV", cls: "es-filterBrowser-filters" },
				{ tag: "BUTTON", type: "button", text: acx.text("General.Search"), onclick: this._search_handler },
				{ tag: "LABEL", children:
					acx.i18n.formatComplex("FilterBrowser.OutputType", { tag: "SELECT", cls: "es-filterBrowser-outputFormat", children: [ acx.text("Output.Table"), acx.text("Output.JSON")].map(acx.ut.option_template) } )
				},
				{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", cls: "es-filterBrowser-showSrc" }, acx.text("Output.ShowSource") ] }
			]};
		},
		
		_filter_template: function() {
			return { tag: "DIV", cls: "es-filterBrowser-row", children: [
				{ tag: "SELECT", cls: "es-bool", children: ["must", "must_not", "should"].map(acx.ut.option_template) },
				{ tag: "SELECT", cls: "es-field", onchange: this._changeQueryField_handler, children: this.filters.map(function(f) {
					return { tag: "OPTION", data: { spec: f }, value: f.path.join("."), text: f.path.join(".") };
				})},
				{ tag: "BUTTON", type: "button", text: "+", onclick: this._addFilterRow_handler },
				{ tag: "BUTTON", type: "button", text: "-", onclick: this._removeFilterRow_handler }
			]};
		},
		
		_range_template: function() {
			return { tag: "SPAN", cls: "es-range", children: [
				{ tag: "SELECT", cls: "es-lowop", children: ["from", "gt", "gte"].map(acx.ut.option_template) },
				{ tag: "INPUT", type: "text", cls: "es-lowqual" },
				{ tag: "SELECT", cls: "es-highop", children: ["to", "lt", "lte"].map(acx.ut.option_template) },
				{ tag: "INPUT", type: "text", cls: "es-highqual" }
			]};
		},

		_fuzzy_template: function() {
			return { tag: "SPAN", cls: "es-fuzzy", children: [
				{ tag: "INPUT", cls: "es-qual", type: "text" },
				{ tag: "SELECT", cls: "es-fuzzyop", children: ["max_expansions", "min_similarity"].map(acx.ut.option_template) },
				{ tag: "INPUT", cls: "es-fuzzyqual", type: "text" }
			]};
		}
	});
	
	es.IndexSelector = es.AbstractQuery.extend({
		init: function(parent) {
			this._super();
			this.el = $(this._main_template());
			this.attach( parent );
			this.update();
		},
		update: function() {
			this._request_handler({
				type: "GET",
				path: "_status",
				success: this._update_handler
			});
		},
		
		_update_handler: function(data) {
			var options = [];
			for(var name in data.indices) { options.push(this._option_template(name, data.indices[name])); }
			this.el.find(".es-indexSelector-select").empty().append(this._select_template(options));
			this._indexChanged_handler();
		},
		
		_main_template: function() {
			return { tag: "DIV", cls: "es-indexSelector", children: acx.i18n.formatComplex( "IndexSelector.SearchIndexForDocs", { tag: "SPAN", cls: "es-indexSelector-select" } ) };
		},

		_indexChanged_handler: function() {
			this.fire("indexChanged", this.el.find("SELECT").val());
		},

		_select_template: function(options) {
			return { tag: "SELECT", children: options, onChange: this._indexChanged_handler };
		},
		
		_option_template: function(name, index) {
			return  { tag: "OPTION", value: name, text: acx.text("IndexSelector.NameWithDocs", name, index.docs.num_docs ) };
		}
	});
	
})( window.acx, window.Raphael );


(function( app ) {

	var services = app.ns("services");

	services.storage = (function() {
		var storage = {};
		return {
			get: function(k) { try { return JSON.parse(localStorage[k] || storage[k]); } catch(e) { return null; } },
			set: function(k, v) { v = JSON.stringify(v); localStorage[k] = v; storage[k] = v; }
		};
	})();

})( this.app );



(function( $, app ) {

	var services = app.ns("services");

	services.Cluster = acx.Class.extend({
		defaults: {
			base_uri: "http://localhost:9200/"
		},
		request: function( params ) {
			return $.ajax( acx.extend({
				url: this.config.base_uri + params.path,
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
(function( $, app ) {

	var ui = app.ns("ui");

	ui.Connect = ui.SplitButton.extend({
		defaults: {
			label: "Connect",
			items: [
				{ label: "localhost:9200", value: "http://localhost:9200", selected: true },
				{ label: "Connection Manager...", value: -1 }
			]
		}
	});

})( this.jQuery, this.app );

(function( $, app ) {

	var ui = app.ns("ui");

	ui.Header = ui.AbstractWidget.extend({
		init: function() {
			this._super();
			this.el = $( this._main_template() );
		},
		_main_template: function() { return (
			{ tag: "DIV", cls: "uiHeader", children: [
				{ tag: "H1", text: "elasticsearch" },
				new ui.Connect({})
			] }
		); }
	});

})( this.jQuery, this.app );
(function( app ) {

	var ui = app.ns("ui");
	var es = window.es;
	var acx = window.acx;

	app.App = ui.AbstractWidget.extend({
		defaults: {
			base_uri: localStorage["base_uri"] || "http://localhost:9200/"   // the default ElasticSearch host
		},
		init: function(parent) {
			this._super();
			this.base_uri = this.config.base_uri;
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
			this.cluster = new app.services.Cluster({ base_uri: this.base_uri });
			this.el = $(this._main_template());
			this.attach( parent );
			this.instances = {};
			this.quicks = {};
		},

		quick: function(title, path) {
			this.quicks[path] && this.quicks[path].remove();
			this.cluster.get(path, function(data) {
				this.quicks[path] = new ui.JsonPanel({ title: title, json: data });
			}.bind(this));
		},
		
		show: function(type, config, jEv) {
			if(! this.instances[type]) {
				var page = this.instances[type] = new es.ui[type](config);
				this.el.find("#"+this.id("body")).append( page );
			}
			$(jEv.target).closest("DIV.es-header-menu-item").addClass("active").siblings().removeClass("active");
			for(var p in this.instances) {
				this.instances[p][ p === type ? "show" : "hide" ]();
			}
		},

		showNew: function(type, config, jEv, tab_text) {
			var that = this,
				type_name = '',
				type_index = 0,
				page, $tab;

			// Loop through until we find an unused type name
			while (type_name === '') {
				type_index++;
				if (!this.instances[type + type_index.toString()]) {
					// Found an available type name, so put it together and add it to the UI
					type_name = type + type_index.toString();
					page = this.instances[type_name] = new es.ui[type](config);
					this.el.find("#"+this.id("body")).append( page );
				}
			}

			// Make sure we have text for the tab
			if (tab_text) {
				tab_text += ' ' + type_index.toString();
			} else {
				tab_text = type_name;
			}

			// Add the tab and its click handlers
			$tab = this.newTab(tab_text, {
				click: function (jEv) {
					that.show(type_name, config, jEv);
				},
				close_click: function (jEv) {
					$tab.remove();
					$(page).remove();
					delete that.instances[type_name];
				}
			});
			
			// Click the new tab to make it show
			$tab.trigger('click');
		},

		_openAnyRequest_handler: function(jEv) { this.show("AnyRequest", { cluster: this.cluster }, jEv); },
		_openNewAnyRequest_handler: function(jEv) { this.showNew("AnyRequest", { cluster: this.cluster }, jEv, acx.text("Nav.AnyRequest")); return false; },
		_openStructuredQuery_handler: function(jEv) { this.show("StructuredQuery", { cluster: this.cluster, base_uri: this.base_uri }, jEv); },
		_openNewStructuredQuery_handler: function(jEv) { this.showNew("StructuredQuery", { cluster: this.cluster, base_uri: this.base_uri }, jEv, acx.text("Nav.StructuredQuery")); return false; },
		_openBrowser_handler: function(jEv) { this.show("Browser", { cluster: this.cluster }, jEv);  },
		_openClusterHealth_handler: function(jEv) { this.quick( acx.text("Nav.ClusterHealth"), "_cluster/health" ); },
		_openClusterState_handler: function(jEv) { this.quick( acx.text("Nav.ClusterState"), "_cluster/state" ); },
		_openClusterNodes_handler: function(jEv) { this.quick( acx.text("Nav.ClusterNodes"), "_cluster/nodes" ); },
		_openClusterNodesStats_handler: function(jEv) { this.quick( acx.text("Nav.NodeStats"), "_cluster/nodes/stats" ); },
		_openStatus_handler: function(jEv) { this.quick( acx.text("Nav.Status"), "_status" ); },
		_openInfo_handler: function(jEv) { this.quick( acx.text("Nav.Info"), "" ); },
		_openClusterOverview_handler: function(jEv) { this.show("ClusterOverview", { cluster: this.cluster }, jEv); },

		_main_template: function() {
			return { tag: "DIV", cls: "es", children: [
				new ui.Header({}),
				{ tag: "DIV", id: this.id("header"), cls: "es-header", children: [
					{ tag: "DIV", cls: "es-header-top", children: [
						new es.ClusterConnect({ base_uri: this.base_uri, onStatus: this._status_handler, onReconnect: this._reconnect_handler }),
						{ tag: "H1", text: acx.text("General.ElasticSearch") }
					]},
					{ tag: "DIV", cls: "es-header-menu", children: [
						{ tag: "DIV", cls: "es-header-menu-item es-left", text: acx.text("Nav.Overview"), onclick: this._openClusterOverview_handler },
						{ tag: "DIV", cls: "es-header-menu-item es-left", text: acx.text("Nav.Browser"), onclick: this._openBrowser_handler },
						{ tag: "DIV", cls: "es-header-menu-item es-left", text: acx.text("Nav.StructuredQuery"), onclick: this._openStructuredQuery_handler, children: [
							{ tag: "A", text: ' [+]', onclick: this._openNewStructuredQuery_handler}
						] },
						{ tag: "DIV", cls: "es-header-menu-item es-left", text: acx.text("Nav.AnyRequest"), onclick: this._openAnyRequest_handler, children: [
							{ tag: "A", text: ' [+]', onclick: this._openNewAnyRequest_handler}
						] },
						{ tag: "DIV", cls: "es-header-menu-item es-right", text: acx.text("Nav.ClusterHealth"), onclick: this._openClusterHealth_handler },
						{ tag: "DIV", cls: "es-header-menu-item es-right", text: acx.text("Nav.ClusterState"), onclick: this._openClusterState_handler },
						{ tag: "DIV", cls: "es-header-menu-item es-right", text: acx.text("Nav.ClusterNodes"), onclick: this._openClusterNodes_handler },
						{ tag: "DIV", cls: "es-header-menu-item es-right", text: acx.text("Nav.NodeStats"), onclick: this._openClusterNodesStats_handler },
						{ tag: "DIV", cls: "es-header-menu-item es-right", text: acx.text("Nav.Status"), onclick: this._openStatus_handler },
						{ tag: "DIV", cls: "es-header-menu-item es-right", text: acx.text("Nav.Info"), onclick: this._openInfo_handler }
					]}
				]},
				{ tag: "DIV", id: this.id("body") }
			]};
		},

		newTab: function(text, events) {
			var $el = $({tag: 'DIV', cls: 'es-header-menu-item es-left', text: text, children: [
				{tag: 'A', text: ' [-]'}
			]});

			// Apply the events to the tab as given
			$.each(events || {}, function (event_name, fn) {
				if (event_name === 'close_click') {
					$('a',$el).bind('click', fn);
				} else {
					$el.bind(event_name, fn);
				}
			});

			$('.es-header-menu').append($el);
			return $el;
		},
		
		_status_handler: function(status) {
			this.el.find(".es-header-menu-item:first").click();
		},
		_reconnect_handler: function() {
			localStorage["base_uri"] = this.base_uri;
		}

	});

})( this.app );

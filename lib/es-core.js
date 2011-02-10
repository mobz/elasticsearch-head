(function() {
	var es = window.es = {};

	/*
	notes on elasticsearch terminology used in this project

 indices[index] contains one or more
 types[type] contains one or more
 documents contain one or more
 fields[path]
 each fields map to one index_name / name

 eg PUT, "/twitter/tweet/1" { user: "mobz", date: "2011-01-01", message: "You know, for browsing elasticsearch", name: { first: "Ben", last: "Birch" } }
   creates
   	1 index: twitter
   	1 type: tweet
   	1 document: /twitter/tweet/1
   	5 fields: [ ["user"], ["date"], ["message"], ["name","first"], ["name","last"] ] which map to
   	5 index_names: [ "user", "date", "message", "first", "last" ]

	 */

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

	es.Cluster = acx.Class.extend({
		defaults: {
			base_uri: "http://localhost:9200/"
		},
		query: function(params) {
			return $.ajax(acx.extend({
				url: this.config.base_uri + params.path,
				dataType: "json",
				error: function(xhr, type, message) {
					if("console" in window) {
						console.log({ "XHR Error": type, "message": message });
					}
				}
			},  params));
		},
		"get": function(path, success) { return this.query( { type: "GET", path: path, success: success } ); },
		"post": function(path, data, success) { return this.query( { type: "POST", path: path, data: data, success: success } ); },
		"put": function(path, data, success) { return this.query( { type: "PUT", path: path, data: data, success: success } ); },
		"delete": function(path, data, success) { return this.query( { type: "DELETE", path: path, data: data, success: success } ); }
	});

	// parses metatdata from a cluster
	es.MetaData = acx.ux.Observable.extend({
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
			var types = [].concat(this.typesList);
			indices && indices.forEach(function(index) {

			});
			return types;
		},
		refresh: function(state) {
			// will not handle multiple fields that reference the same index_name, or multiple indexes with the same types (at the moment)
			var aliases = this.aliases = {};
			var indices = this.indices = {};
			var types = this.types = {};
			var names = this.names = {};
			function createName(mapping, path, field_name) {
				return acx.extend({
					index_name: field_name, core_type: coretype_map[mapping.type], path: path, dpath: path.join(".")
				}, default_property_map[coretype_map[mapping.type]], mapping);
			}
			function getNames(properties) {
				var listeners = Array.prototype.slice.call(arguments, 1);
				(function(prop, path) {
					for(var n in prop) {
						if("properties" in prop[n]) {
							arguments.callee(prop[n].properties, path.concat(n));
						} else {
							var name = createName(prop[n], path.concat(n), n);
							listeners.forEach(function(obj) { obj[name.index_name] = name; });
						}
					}
				})(properties, []);
			}
			for(var index in state.metadata.indices) {
				indices[index] = { types: {}, names: {}, fields: {} };
				indices[index].aliases = state.metadata.indices[index].aliases;
				indices[index].aliases.forEach(function(alias) {
					aliases[alias] = aliases[alias] ? aliases[alias].push(index) : [ index ];
				});
				var mapping = state.metadata.indices[index].mappings;
				for(var type in mapping) {
					types[type] = { indices: [ index ], names: {} };
					getNames(mapping[type].properties, names, types[type].names, indices[index].names);
				}
			}
			this.aliasesList = Object.keys(aliases);
			this.indicesList = Object.keys(indices);
			this.typesList = Object.keys(types);
			this.namesList = Object.keys(names);
		}
	});

	es.MetaDataFactory = acx.ux.Observable.extend({
		defaults: {
			cluster: null // (required) an es.Cluster
		},
		init: function() {
			this._super();
			this.config.cluster.get("_cluster/state", function(data) {
				this.metaData = new es.MetaData({state: data});
				this.fire("ready", this.metaData);
			}.bind(this));
		}
	});

	es.Query = acx.ux.Observable.extend({
		defaults: {
			cluster: null,  // (required) instanceof es.Cluster
			size: 50		    // size of pages to return
		},
		init: function() {
			this._super();
			this.cluster = this.config.cluster;
			this.refuid = 0;
			this.refmap = {};
			this.indices = [];
			this.types = [];
			this.search = {
				query: { bool: { must: [], must_not: [], should: [] } },
				from: 0,
				size: this.config.size,
				sort: [],
				facets: {}
			};
			this.defaultClause = this.addClause();
		},
		query: function() {
			this.cluster.post(
					(this.indices.join(",") || "_all") + "/" + ( this.types.length ? this.types.join(",") + "/" : "") + "_search",
					this.getData(),
					function(results) {
						this.fire("results", this, results);
					}.bind(this));
		},
		setPage: function(page) {
			this.search.from = this.config.size * (page - 1) + 1;
		},
		setIndex: function(index, add) {
			if(add) {
				if(! this.indices.contains(index)) this.indices.push(index);
			} else {
				this.indices.remove(index);
			}
			this.fire("change", this);
		},
		setTypes: function(types) {
			this.indices = [].concat(types);
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
			bool.splice(bool.indexOf(ref.clause), 1);
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

	es.QueryDataSourceInterface = acx.data.DataSourceInterface.extend({
		defaults: {
			query: null  // (required) instanceof es.Query the data source
		},
		init: function() {
			this._super();
			this.config.query.on("results", this._results_handler.bind(this));
		},
		_results_handler: function(query, res) {
			this.meta = { total: res.hits.total, shards: res._shards, tool: res.took };
			this.summary = acx.text("TableResults.Summary", res._shards.successful, res._shards.total, res.hits.total, (res.took / 1000).toFixed(3));
			this.columns = (function(path, spec, headers) {
				for(var prop in spec) {
					acx.isObject(spec[prop]) ? arguments.callee(path.concat(prop), spec[prop], headers) : headers.push({ name: prop, path: path.concat(prop)});
				}
				return headers;
			})([], res.hits.hits[0], []);
			this.data = res.hits.hits.map(function(hit) {
				var row = this.columns.reduce(function(row, column) {
					try {
						var val = column.path.reduce(function(e, h) { return e[h]; }, hit).toString();
					} catch(e) { }
					row[column.name] = val || "";
					return row;
				}, {});
				row._source = hit;
				return row;
			}, this);

			this.fire("data", this);
		}
	});

})();














